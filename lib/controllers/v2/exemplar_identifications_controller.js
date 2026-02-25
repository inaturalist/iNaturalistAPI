const _ = require( "lodash" );
const { exemplar_identifications: exemplarIdentifications } = require( "inaturalistjs" );
const ExemplarIdentification = require( "../../models/exemplar_identification" );
const esClient = require( "../../es_client" );
const ESModel = require( "../../models/es_model" );
const ControlledTerm = require( "../../models/controlled_term" );
const InaturalistAPI = require( "../../inaturalist_api" );
const util = require( "../../util" );

const ExemplarIdentificationsController = class ExemplarIdentificationsController {
  static async search( req ) {
    if ( !req.userSession || ( req.userSession && !req.userSession.isAdmin ) ) {
      throw util.httpError( 401, "Unauthorized" );
    }
    let response = await ExemplarIdentificationsController.resultsForRequest( req );
    if ( req.query.include_category_counts ) {
      response = await ExemplarIdentificationsController.includeCategoryCounts( req, response );
    }
    if ( req.query.include_category_controlled_terms ) {
      response = await ExemplarIdentificationsController.includeCategoryControlledTerms(
        req, response
      );
    }
    return response;
  }

  static async resultsForRequest( req ) {
    const response = await ExemplarIdentificationsController.elasticResults( req );
    const exemplars = _.map(
      response.hits.hits,
      h => new ExemplarIdentification( h._source )
    );
    await ExemplarIdentification.preloadAllAssociations( req, exemplars );
    return {
      total_results: response.hits.total
        ? response.hits.total.value
        : exemplars.length,
      page: Number( req.elastic_query.page ),
      per_page: Number( req.elastic_query.per_page ),
      results: exemplars
    };
  }

  static async elasticResults( req ) {
    const query = ExemplarIdentificationsController.reqToElasticQuery( req );
    return ESModel.elasticResults( req, query, "exemplar_identifications", {
      trackTotalHits: !req.query.skip_total_hits && !req.query.no_total_hits,
      skipTotalHits: req.query.skip_total_hits,
      noTotalHits: req.query.no_total_hits
    } );
  }

  static reqToElasticQuery( req ) {
    const p = req.query;
    const params = _.assignIn( { }, p );
    const searchFilters = [];
    const inverseFilters = [];

    searchFilters.push( esClient.termFilter( "active", true ) );

    _.each( [
      { http_param: "id", es_field: "id" },
      { http_param: "taxon_id", es_field: "identification.taxon.ancestor_ids.keyword" },
      { http_param: "direct_taxon_id", es_field: "identification.taxon.id.keyword" }
    ], filter => {
      if ( params[filter.http_param] && params[filter.http_param] !== "any" ) {
        searchFilters.push( esClient.termFilter(
          filter.es_field, params[filter.http_param]
        ) );
      }
    } );

    if ( params.upvoted === "true" ) {
      searchFilters.push( { range: { cached_votes_total: { gt: 0 } } } );
    } else if ( params.upvoted === "false" ) {
      inverseFilters.push( { range: { cached_votes_total: { gt: 0 } } } );
    }
    if ( params.downvoted === "true" ) {
      searchFilters.push( { range: { cached_votes_total: { lt: 0 } } } );
    } else if ( params.downvoted === "false" ) {
      inverseFilters.push( { range: { cached_votes_total: { lt: 0 } } } );
    }
    if ( params.nominated === "true" ) {
      searchFilters.push( { exists: { field: "nominated_by_user_id" } } );
    } else if ( params.nominated === "false" ) {
      inverseFilters.push( { exists: { field: "nominated_by_user_id" } } );
    }

    if ( params.q ) {
      searchFilters.push( {
        match: {
          "identification.body": {
            query: params.q,
            operator: "and"
          }
        }
      } );
    }

    if ( params.term_value_id ) {
      searchFilters.push( {
        nested: {
          path: "identification.observation.annotations",
          query: {
            bool: {
              filter: esClient.termFilter(
                "identification.observation.annotations.controlled_value_id.keyword",
                params.term_value_id
              )
            }
          }
        }
      } );
    }

    const sortOrder = ( params.order || "desc" ).toLowerCase( );
    let sort;
    switch ( params.order_by ) {
      case "word_count":
        sort = { "identification.body_word_length": sortOrder };
        break;
      case "created_at":
        sort = { "identification.created_at": sortOrder };
        break;
      default:
        sort = {
          cached_votes_total: sortOrder,
          id: "desc"
        };
    }

    const elasticQuery = {
      filters: searchFilters,
      inverse_filters: inverseFilters,
      per_page: InaturalistAPI.perPage( req, { default: 50, max: 200 } ),
      page: req.query.page || 1,
      sort
    };
    return elasticQuery;
  }

  static async includeCategoryCounts( req, response ) {
    const aggQuery = {
      size: 0,
      filters: [
        esClient.termFilter( "identification.taxon.id.keyword", req.query.direct_taxon_id ),
        esClient.termFilter( "active", true )
      ],
      aggs: {
        category_counts: {
          filters: {
            filters: {
              upvoted: {
                bool: {
                  filter: [
                    { range: { cached_votes_total: { gt: 0 } } },
                    { exists: { field: "nominated_by_user_id" } }
                  ]
                }
              },
              downvoted: {
                bool: {
                  filter: [
                    { range: { cached_votes_total: { lt: 0 } } },
                    { exists: { field: "nominated_by_user_id" } }
                  ]
                }
              },
              no_votes: {
                bool: {
                  filter: [
                    { term: { cached_votes_total: 0 } },
                    { exists: { field: "nominated_by_user_id" } }
                  ]
                }
              },
              not_nominated: {
                bool: {
                  must_not: [
                    { exists: { field: "nominated_by_user_id" } }
                  ]
                }
              }
            }
          }
        }
      }
    };
    const aggsResponse = await ESModel.elasticResults( req, aggQuery, "exemplar_identifications", {
      noTotalHits: true
    } );
    const counts = aggsResponse.aggregations.category_counts.buckets;
    return {
      ...response,
      category_counts: {
        upvoted: counts.upvoted.doc_count,
        no_votes: counts.no_votes.doc_count,
        downvoted: counts.downvoted.doc_count,
        not_nominated: counts.not_nominated.doc_count
      }
    };
  }

  static async includeCategoryControlledTerms( req, response ) {
    const query = ExemplarIdentificationsController.reqToElasticQuery( req );
    const filters = _.reject( query.filters, filter => (
      filter?.nested?.path === "identification.observation.annotations"
    ) );
    const aggQuery = {
      size: 0,
      filters,
      inverse_filters: query.inverse_filters,
      aggs: {
        nested_annotations: {
          nested: { path: "identification.observation.annotations" },
          aggs: {
            attributes: {
              terms: {
                field: "identification.observation.annotations.concatenated_attr_val",
                size: 100
              }
            }
          }
        }
      }
    };
    const aggsResponse = await ESModel.elasticResults( req, aggQuery, "exemplar_identifications", {
      noTotalHits: true
    } );
    let controlledTerms = [];
    const controlledTermsIDs = { };
    _.each( aggsResponse.aggregations.nested_annotations.attributes.buckets, b => {
      const pieces = b.key.split( "|" );
      controlledTermsIDs[Number( pieces[0] )] = true;
      controlledTermsIDs[Number( pieces[1] )] = true;
      const result = {
        controlled_attribute_id: pieces[0],
        controlled_value_id: pieces[1],
        count: b.doc_count
      };
      controlledTerms.push( result );
    } );
    const terms = await ESModel.fetchInstancesByIDsObject( controlledTermsIDs, ControlledTerm );
    _.each( terms, ( t, controlledAttributeID ) => {
      terms[controlledAttributeID] = new ControlledTerm( t );
      terms[controlledAttributeID].values = _.map( t.values, v => ( new ControlledTerm( v ) ) );
    } );
    _.each( controlledTerms, r => {
      if ( terms[r.controlled_attribute_id] ) {
        r.controlled_attribute = {
          id: terms[r.controlled_attribute_id].id,
          label: terms[r.controlled_attribute_id].label
        };
        delete r.controlled_attribute_id;
      }
      if ( terms[r.controlled_value_id] ) {
        r.controlled_value = {
          id: terms[r.controlled_value_id].id,
          label: terms[r.controlled_value_id].label
        };
        delete r.controlled_value_id;
      }
    } );
    controlledTerms = _.filter( controlledTerms, r => (
      r.controlled_attribute && r.controlled_value
    ) );
    return {
      ...response,
      category_controlled_terms: controlledTerms
    };
  }

  static async vote( req ) {
    req.params.id = req.params.id || req.params.uuid;
    // If there are no errors, this will be a 204 and there's no response
    await InaturalistAPI.iNatJSWrap( exemplarIdentifications.vote, req );
    return null;
  }

  static async unvote( req ) {
    req.params.id = req.params.id || req.params.uuid;
    // If there are no errors, this will be a 204 and there's no response
    await InaturalistAPI.iNatJSWrap( exemplarIdentifications.unvote, req );
    return null;
  }
};

module.exports = ExemplarIdentificationsController;
