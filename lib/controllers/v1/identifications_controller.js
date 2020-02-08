const _ = require( "lodash" );
const { identifications } = require( "inaturalistjs" );
const util = require( "../../util" );
const esClient = require( "../../es_client" );
const ESModel = require( "../../models/es_model" );
const TaxaController = require( "./taxa_controller" );
const Identification = require( "../../models/identification" );
const Observation = require( "../../models/observation" );
const Taxon = require( "../../models/taxon" );
const User = require( "../../models/user" );
const InaturalistAPI = require( "../../inaturalist_api" );

const IdentificationsController = class IdentificationsController {
  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( identifications.create, req ).then( r => {
      const arr = [{ identification_id: r.id }];
      const localeOpts = util.localeOpts( req );
      Identification.preloadInto( arr, localeOpts, ( ) => callback( null, arr[0].identification ) );
    } ).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( identifications.update, req ).then( r => {
      const arr = [{ identification_id: r.id }];
      const localeOpts = util.localeOpts( req );
      Identification.preloadInto( arr, localeOpts, ( ) => callback( null, arr[0].identification ) );
    } ).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( identifications.delete, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static show( req ) {
    const ids = _.filter( req.params.id.split( "," ), _.identity );
    // also preserve the ttl and locale params
    req.query = {
      id: ids,
      ttl: req.query.ttl,
      locale: req.query.locale,
      preferred_place_id: req.query.preferred_place_id
    };
    return IdentificationsController.search( req );
  }

  static async search( req ) {
    const response = await IdentificationsController.resultsForRequest( req );
    const localeOpts = util.localeOpts( req );
    localeOpts.minimal = true;
    if ( req.query.only_id && req.query.only_id !== "false" ) {
      response.results = _.map( response.results, r => ( { id: r.id } ) );
      return response;
    }
    await Promise.all( [
      Observation.preloadInto( response.results, localeOpts ),
      ESModel.fetchBelongsToAsync( response.results, User )
    ] );
    return response;
  }

  static categories( req, callback ) {
    const countQuery = _.assignIn( { }, req.query );
    countQuery.aggs = {
      categories: {
        terms: { field: "category" }
      }
    };
    countQuery.per_page = 0;
    const countReq = _.assignIn( { }, req, { query: countQuery } );
    IdentificationsController.elasticResults( countReq ).then( data => {
      const buckets = _.map( data.aggregations.categories.buckets, b => (
        { category: b.key, count: b.doc_count }
      ) );
      callback( null, {
        total_results: _.size( buckets ),
        page: 1,
        per_page: _.keys( buckets ).length,
        results: _.sortBy( buckets, b => -1 * b.count )
      } );
    } ).catch( callback );
  }

  static async resultsForRequest( req ) {
    const response = await IdentificationsController.elasticResults( req );
    const ids = _.map( response.hits.hits, h => new Identification( h._source ) );
    return {
      total_results: response.hits.total.value,
      page: Number( req.elastic_query.page ),
      per_page: Number( req.elastic_query.per_page ),
      results: ids
    };
  }

  static async elasticResults( req ) {
    const query = IdentificationsController.reqToElasticQuery( req );
    return ESModel.elasticResultsAsync( req, query, "identifications", { track_total_hits: true } );
  }

  static reqToElasticQuery( req ) {
    const p = req.query;
    // clone the params object
    const params = _.assignIn( { }, p );
    const searchFilters = [];
    const inverseFilters = [];

    if ( !_.isEmpty( params.user_id ) && !Number( params.user_id )
         && !_.isArray( params.user_id ) ) {
      params.user_login = params.user_id;
      delete params.user_id;
    }

    if ( params.current !== "false" && params.current !== "any" ) {
      params.current = "true";
    }
    _.each( [
      { http_param: "current_taxon", es_field: "current_taxon" },
      { http_param: "own_observation", es_field: "own_observation" },
      { http_param: "taxon_active", es_field: "taxon.is_active" },
      { http_param: "observation_taxon_active", es_field: "observation.taxon.is_active" }
    ], filter => {
      if ( params[filter.http_param] === "true" ) {
        searchFilters.push( esClient.termFilter( filter.es_field, true ) );
      } else if ( params[filter.http_param] === "false" ) {
        searchFilters.push( esClient.termFilter( filter.es_field, false ) );
      }
    } );

    _.each( [
      { http_param: "id", es_field: "id" },
      { http_param: "observation_id", es_field: "observation.id" },
      { http_param: "rank", es_field: "taxon.rank" },
      { http_param: "observation_rank", es_field: "observation.taxon.rank" },
      { http_param: "user_id", es_field: "user.id" },
      { http_param: "user_login", es_field: "user.login" },
      { http_param: "current", es_field: "current" },
      { http_param: "category", es_field: "category" },
      { http_param: "taxon_id", es_field: "taxon.ancestor_ids" },
      { http_param: "place_id", es_field: "observation.place_ids" },
      { http_param: "quality_grade", es_field: "observation.quality_grade" },
      { http_param: "observation_taxon_id", es_field: "observation.taxon.ancestor_ids" },
      { http_param: "iconic_taxon_id", es_field: "taxon.iconic_taxon_id" },
      { http_param: "observation_iconic_taxon_id", es_field: "observation.taxon.iconic_taxon_id" },
      { http_param: "disagreement", es_field: "disagreement" },
      { http_param: "disagreement_type", es_field: "disagreement_type" }
    ], filter => {
      if ( params[filter.http_param] && params[filter.http_param] !== "any" ) {
        searchFilters.push( esClient.termFilter(
          filter.es_field, params[filter.http_param]
        ) );
      }
    } );

    _.each( [
      { http_param: "is_change", es_field: "taxon_change.id" }
    ], filter => {
      const f = { exists: { field: filter.es_field } };
      if ( params[filter.http_param] === "true" ) {
        searchFilters.push( f );
      } else if ( params[filter.http_param] === "false" ) {
        inverseFilters.push( f );
      }
    } );

    if ( params.hrank || params.lrank ) {
      searchFilters.push( {
        range: {
          "taxon.rank_level": {
            gte: Taxon.ranks[params.lrank] || 0,
            lte: Taxon.ranks[params.hrank] || 100
          }
        }
      } );
    }

    if ( params.observation_hrank || params.observation_lrank ) {
      searchFilters.push( {
        range: {
          "observation.taxon.rank_level": {
            gte: Taxon.ranks[params.observation_lrank] || 0,
            lte: Taxon.ranks[params.observation_hrank] || 100
          }
        }
      } );
    }

    if ( params.without_taxon_id ) {
      inverseFilters.push( {
        terms: {
          "taxon.ancestor_ids": util.paramArray( params.without_taxon_id )
        }
      } );
    }
    if ( params.without_observation_taxon_id ) {
      inverseFilters.push( {
        terms: {
          "observation.taxon.ancestor_ids": util.paramArray( params.without_observation_taxon_id )
        }
      } );
    }

    let dateFilter = util.dateRangeFilter( "created_at", params.d1, params.d2 );
    if ( dateFilter ) {
      searchFilters.push( dateFilter );
    }
    dateFilter = util.dateRangeFilter( "observation.observed_on", params.observed_d1, params.observed_d2 );
    if ( dateFilter ) {
      searchFilters.push( dateFilter );
    }
    dateFilter = util.dateRangeFilter( "observation.created_at", params.observation_created_d1,
      params.observation_created_d2 );
    if ( dateFilter ) {
      searchFilters.push( dateFilter );
    }

    if ( params.id_above ) {
      searchFilters.push( { range: { id: { gt: params.id_above } } } );
    }
    if ( params.id_below ) {
      searchFilters.push( { range: { id: { lt: params.id_below } } } );
    }

    // sort defaults to created at descending
    const sortOrder = ( params.order || "desc" ).toLowerCase( );
    let sort;
    switch ( params.order_by ) {
      case "id":
        sort = { id: sortOrder };
        break;
      default:
        sort = { created_at: sortOrder };
    }

    const elasticQuery = {
      filters: searchFilters,
      inverse_filters: inverseFilters,
      per_page: InaturalistAPI.perPage( req, { default: 30, max: 200 } ),
      page: req.query.page || 1,
      sort
    };
    return elasticQuery;
  }

  static leafCounts( req, callback ) {
    let field = "taxon.min_species_ancestry";
    if ( req.query.taxon_of !== "identification" ) {
      field = `observation.${field}`;
    }
    ESModel.ancestriesSpeciesCounts( req, field,
      IdentificationsController.elasticResults, callback );
  }

  static speciesCounts( req, callback ) {
    IdentificationsController.speciesCountsWithOptions( req, { }, callback );
  }

  static speciesCountsWithOptions( req, options, callback ) {
    IdentificationsController.leafCounts( req, ( err, leafCounts ) => {
      if ( err ) { return void callback( err ); }
      TaxaController.speciesCountsResponse( req, leafCounts, options, callback );
    } );
  }

  static similarSpecies( req, callback ) {
    if ( !req.query.taxon_id ) {
      return void callback( { error: "Missing required parameter `taxon_id`", status: 422 } );
    }
    Taxon.findByID( req.query.taxon_id ).then( taxon => {
      if ( !taxon ) {
        return void callback( { error: `Unknown taxon ${req.query.taxon_id}`, status: 422 } );
      }
      if ( taxon.rank_level > 20 ) {
        return void callback( { error: `Taxon ${req.query.taxon_id} is not genus or finer`, status: 422 } );
      }
      const sharedQuery = {
        current: "any",
        current_taxon: "false",
        ttl: req.query.ttl,
        locale: req.query.locale,
        preferred_place_id: req.query.preferred_place_id,
        place_id: req.query.place_id
      };
      // First get idents of this taxon on obs not of this taxon
      let idQuery = _.assignIn( { }, sharedQuery, {
        taxon_id: req.query.taxon_id,
        observation_iconic_taxon_id: taxon.iconic_taxon_id,
        without_observation_taxon_id: req.query.taxon_id,
        observation_taxon_active: "true"
      } );
      // return species which are commonly mis-ID'd as this species
      const inat = Object.assign( {}, req.inat, { taxonAncestries: true } );
      const speciesCountsReq1 = Object.assign( {}, req, { query: idQuery, inat } );
      IdentificationsController.speciesCountsWithOptions( speciesCountsReq1, { photos: true },
        ( errr, rsp1 ) => {
          if ( errr ) { return void callback( errr ); }
          // Then get idents not of this taxon on obs of this taxon
          idQuery = _.assignIn( { }, sharedQuery, {
            observation_taxon_id: req.query.taxon_id,
            iconic_taxon_id: taxon.iconic_taxon_id,
            without_taxon_id: req.query.taxon_id,
            taxon_of: "identification",
            taxon_active: "true"
          } );
          const speciesCountsReq2 = Object.assign( {}, req, { query: idQuery, inat } );
          // return incorrect species IDs which end up as this species
          IdentificationsController.speciesCountsWithOptions( speciesCountsReq2, { photos: true },
            ( errrr, rsp2 ) => {
              if ( errrr ) { return void callback( errrr ); }
              // And combine the two sets of results
              const { results } = rsp1;
              _.each( rsp2.results, res2 => {
                const same = _.find( results, r => r.taxon.id === res2.taxon.id );
                if ( same ) {
                  // the taxon was in both lists, so combine the counts
                  same.count += res2.count;
                } else {
                  results.push( res2 );
                }
              } );
              // Derive the taxa that match the rank of the requested taxon.
              // This will mostly just show genera implied by situations where
              // species have been mistaken for one another, and there's
              // probably a bunch of complex situations it will miss, like genus
              // IDs that disagree with species, etc.
              const rankResults = [];
              _.each( results, r => {
                let rankMatch = r;
                if ( r.taxon.rank !== taxon.rank ) {
                  const rankMatchTaxon = _.find( r.taxon.ancestors, a => a.rank === taxon.rank );
                  if ( rankMatchTaxon ) {
                    rankMatch = Object.assign( {}, r, { taxon: rankMatchTaxon } );
                  }
                }
                if ( rankMatch ) {
                  const existing = _.find( rankResults, rr => rr.taxon.id === rankMatch.taxon.id );
                  if ( existing ) {
                    existing.count += rankMatch.count;
                  } else {
                    rankResults.push( rankMatch );
                  }
                }
              } );
              callback( null, {
                total_results: rankResults.length,
                page: 1,
                per_page: rankResults.length,
                results: _.sortBy( rankResults, r => -1 * r.count )
              } );
            } );
        } );
    } ).catch( callback );
  }

  static identifiers( req, callback ) {
    const countQuery = _.assignIn( { }, req.query );
    const perPage = req.query.per_page || 500;
    countQuery.aggs = {
      total: { cardinality: { field: "user.id", precision_threshold: 10000 } },
      users: { terms: { field: "user.id", size: perPage } }
    };
    ESModel.userAggregationQuery( req, countQuery,
      IdentificationsController.elasticResults, { }, callback );
  }

  static observers( req, callback ) {
    const countQuery = _.assignIn( { }, req.query );
    const perPage = req.query.per_page || 500;
    countQuery.aggs = {
      total: { cardinality: { field: "observation.user_id", precision_threshold: 10000 } },
      users: { terms: { field: "observation.user_id", size: perPage } }
    };
    ESModel.userAggregationQuery( req, countQuery,
      IdentificationsController.elasticResults, { }, callback );
  }

  static async recentTaxa( req ) {
    const maxAggregations = 500;
    let page = Number( req.query.page || 1 );
    page = page < 1 ? 1 : page;
    let perPage = Number( req.query.per_page || 10 );
    perPage = perPage > maxAggregations ? maxAggregations : perPage;
    const countQuery = _.assignIn( { }, req.query, {
      current: "true",
      current_taxon: "true",
      taxon_active: "true",
      is_change: "false"
    } );
    countQuery.aggs = {
      total: { cardinality: { field: "taxon.min_species_ancestors.id" } },
      taxa: {
        terms: {
          field: "taxon.min_species_ancestors.id",
          order: { "earliest.value": "desc" },
          size: maxAggregations
        },
        aggs: {
          earliest: {
            min: { field: "id" }
          }
        }
      }
    };
    countQuery.per_page = 0;
    const countReq = _.assignIn( { }, req, { query: countQuery } );
    const data = IdentificationsController.elasticResults( countReq );
    let buckets = _.map( data.aggregations.taxa.buckets, b => (
      { taxon_id: b.key, identification_id: Number( b.earliest.value ) }
    ) );
    const localeOpts = util.localeOpts( req );
    const prepareTaxon = t => {
      t.prepareForResponse( localeOpts );
    };
    const taxonOpts = {
      modifier: prepareTaxon,
      filters: [{ term: { is_active: true } }],
      source: { excludes: ["photos", "taxon_photos"] }
    };
    const start = ( page - 1 ) * perPage;
    await ESModel.fetchBelongsToAsync( buckets, Taxon, taxonOpts );
    buckets = _.reject( buckets, b => {
      if ( !b.taxon ) { return true; }
      if ( req.query.taxon_id && !_.includes( b.taxon.ancestor_ids, req.query.taxon_id ) ) {
        return true;
      }
      return false;
    } );
    const bucketsPage = _.sortBy( buckets, b => -1 * b.identification_id )
      .slice( start, start + perPage );
    await ESModel.fetchBelongsToAsync( bucketsPage, Identification, { } );
    const idents = _.map( bucketsPage, b => b.identification );
    const obsOpts = {
      source: {
        includes: ["id", "taxon", "photos", "user"]
      }
    };
    await Promise.all( [
      ESModel.fetchBelongsToAsync( idents, Observation, obsOpts ),
      ESModel.fetchBelongsToAsync( idents, User ),
      ESModel.fetchBelongsToAsync( idents.map( i => i.observation ), User, { } ),
      ESModel.fetchBelongsToAsync( idents.map( i => i.observation ), Taxon, taxonOpts )
    ] );
    return {
      total_results: buckets.length,
      page,
      per_page: perPage,
      all_results_available: buckets.length < maxAggregations,
      results: bucketsPage
    };
  }

  static recentTaxaRevisited( req, callback ) {
    const maxAggregations = 500;
    let page = Number( req.query.page || 1 );
    page = page < 1 ? 1 : page;
    let perPage = Number( req.query.per_page || 10 );
    perPage = perPage > maxAggregations ? maxAggregations : perPage;
    const countQuery = _.assignIn( { }, req.query, {
      current: "true",
      current_taxon: "true",
      taxon_active: "true",
      is_change: "false",
      per_page: 0,
      aggs: {
        min_species_taxon_ids: {
          terms: {
            field: "taxon.min_species_taxon_id",
            order: { "earliest.value": "desc" },
            size: maxAggregations
          },
          aggs: {
            earliest: {
              min: { field: "id" }
            }
          }
        }
      }
    } );
    const countReq = _.assignIn( { }, req, { query: countQuery } );
    IdentificationsController.elasticResults( countReq ).then( data => {
      const initialCounts = { };
      const earliestIDs = { };
      const recentLeaves = [];
      _.each( data.aggregations.min_species_taxon_ids.buckets, bucket => {
        initialCounts[bucket.key] = bucket.doc_count;
        recentLeaves.push( { id: bucket.key } );
        earliestIDs[bucket.key] = bucket.earliest.value;
      } );

      const leafTaxonOpts = {
        foreignKey: "id",
        filters: [{ term: { is_active: true } }],
        source: {
          includes: [
            "id",
            "ancestry",
            "min_species_ancestry"
          ]
        }
      };
      ESModel.fetchBelongsTo( recentLeaves, Taxon, leafTaxonOpts, errr => {
        if ( errr ) { return void callback( errr ); }
        const branchAncestryPrefix = req.inat.taxon
          ? req.inat.taxon.min_species_ancestry.split( "," ).slice( 0, -1 ).join( "," )
          : null;
        _.each( recentLeaves, leaf => {
          if ( !branchAncestryPrefix
            || leaf.taxon.min_species_ancestry.match( branchAncestryPrefix )
          ) {
            const branchAncestors = leaf.taxon.min_species_ancestry
              .replace( branchAncestryPrefix, "" )
              .replace( /^,/, "" );
            const ancestorIDs = branchAncestors.split( "," ).slice( 0, -1 ).reverse( );
            _.each( ancestorIDs, aid => {
              earliestIDs[aid] = earliestIDs[leaf.taxon.id];
            } );
          } else {
            // log a taxon ancestry mismatch?
          }
        } );
        const start = ( page - 1 ) * perPage;
        const sortedResultPairs = _.sortBy( _.toPairs( earliestIDs ), p => p[1] * -1 )
          .slice( start, start + perPage );
        const pageResults = _.map( sortedResultPairs, pair => ( {
          taxon_id: Number( pair[0] ),
          identification_id: pair[1]
        } ) );
        ESModel.fetchBelongsTo( pageResults, Identification, { }, err3 => {
          if ( err3 ) { return void callback( err3 ); }
          const idents = _.map( pageResults, b => b.identification );
          const obsOpts = {
            source: {
              includes: ["id", "taxon", "photos", "user"]
            }
          };
          const localeOpts = util.localeOpts( req );
          const prepareTaxon = t => {
            t.prepareForResponse( localeOpts );
          };
          const taxonOpts = {
            modifier: prepareTaxon,
            filters: [{ term: { is_active: true } }],
            source: { excludes: ["photos", "taxon_photos"] }
          };
          ESModel.fetchBelongsTo( pageResults, Taxon, taxonOpts, err2 => {
            if ( err2 ) { return void callback( err2 ); }
            ESModel.fetchBelongsTo( idents, Observation, obsOpts, err4 => {
              if ( err4 ) { return void callback( err4 ); }
              ESModel.fetchBelongsTo( idents, User, { }, err5 => {
                if ( err5 ) { return void callback( err5 ); }
                ESModel.fetchBelongsTo( idents.map( i => i.observation ), User, { }, err6 => {
                  if ( err6 ) { return void callback( err6 ); }
                  ESModel.fetchBelongsTo( idents.map( i => i.observation ), Taxon, taxonOpts,
                    err7 => {
                      if ( err7 ) { return void callback( err7 ); }
                      callback( null, {
                        total_results: _.size( earliestIDs ),
                        page,
                        per_page: perPage,
                        all_results_available: _.size( recentLeaves ) < maxAggregations,
                        results: pageResults
                      } );
                    } );
                } );
              } );
            } );
          } );
        } );
      } );
    } ).catch( callback );
  }
};

module.exports = IdentificationsController;
