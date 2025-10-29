const _ = require( "lodash" );
const TaxonIdentification = require( "../../models/taxon_identification" );
const esClient = require( "../../es_client" );
const ESModel = require( "../../models/es_model" );
const InaturalistAPI = require( "../../inaturalist_api" );

const TaxonIdentificationsController = class TaxonIdentificationsController {
  static async search( req ) {
    const response = await TaxonIdentificationsController.resultsForRequest( req );
    return response;
  }

  static async resultsForRequest( req ) {
    const response = await TaxonIdentificationsController.elasticResults( req );
    const taxonIdentifications = _.map(
      response.hits.hits,
      h => new TaxonIdentification( h._source )
    );
    await TaxonIdentification.preloadAllAssociations( req, taxonIdentifications );
    return {
      total_results: response.hits.total ? response.hits.total.value : taxonIdentifications.length,
      page: Number( req.elastic_query.page ),
      per_page: Number( req.elastic_query.per_page ),
      results: taxonIdentifications
    };
  }

  static async elasticResults( req ) {
    const query = TaxonIdentificationsController.reqToElasticQuery( req );
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

    _.each( [
      { http_param: "id", es_field: "id" },
      { http_param: "uuid", es_field: "uuid" },
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
    } else if ( params.downvoted === "false" ) {
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

    if ( params.direct_taxon_id ) {
      searchFilters.push( esClient.termFilter(
        "identification.observation.taxon.ancestor_ids.keyword", params.direct_taxon_id
      ) );
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
      per_page: InaturalistAPI.perPage( req, { default: 200, max: 200 } ),
      page: req.query.page || 1,
      sort
    };
    return elasticQuery;
  }
};

module.exports = TaxonIdentificationsController;
