"use strict";
var _ = require( "underscore" ),
    identifications = require( "inaturalistjs" ).identifications,
    util = require( "../../util" ),
    esClient = require( "../../es_client" ),
    ESModel = require( "../../models/es_model" ),
    TaxaController = require( "./taxa_controller" ),
    Identification = require( "../../models/identification" ),
    Observation = require( "../../models/observation" ),
    Taxon = require( "../../models/taxon" ),
    User = require( "../../models/user" ),
    InaturalistAPI = require( "../../inaturalist_api" );

var IdentificationsController = class IdentificationsController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( identifications.create, req ).then( r => {
      var arr = [ { identification_id: r.id } ];
      var localeOpts = util.localeOpts( req );
      Identification.preloadInto( arr, localeOpts, ( ) => {
        return callback( null, arr[0].identification );
      });
    }).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( identifications.update, req ).then( r => {
      var arr = [ { identification_id: r.id } ];
      var localeOpts = util.localeOpts( req );
      Identification.preloadInto( arr, localeOpts, ( ) => {
        return callback( null, arr[0].identification );
      });
    }).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( identifications.delete, req  ).then( r => {
      return callback( null, r );
    }).catch( callback );
  }

  static show( req, callback ) {
    var ids = _.filter( req.params.id.split( "," ), _.identity );
    // also preserve the ttl and locale params
    req.query = { id: ids, ttl: req.query.ttl, locale: req.query.locale,
      preferred_place_id: req.query.preferred_place_id };
    IdentificationsController.search( req, callback );
  }

  static search( req, callback ) {
    IdentificationsController.resultsForRequest( req, ( err, data ) => {
      if( err ) { return callback( err ); }
      var localeOpts = util.localeOpts( req );
      localeOpts.minimal = true;
      Observation.preloadInto( data.results, localeOpts, err => {
        if( err ) { return callback( err ); }
        ESModel.fetchBelongsTo( data.results, User, { }, err => {
          if( err ) { return callback( err ); }
          callback( null, data );
        });
      });
    });
  }

  static categories( req, callback ) {
    var countQuery = _.extend( { }, req.query );
    countQuery.aggs = {
      categories: {
        terms: { field: "category" }
      }
    };
    countQuery.per_page = 0;
    var countReq = _.extend( { }, req, { query: countQuery });
    IdentificationsController.elasticResults( countReq, ( err, data ) => {
      if( err ) { return callback( err ); }
      var buckets = _.map( data.aggregations.categories.buckets, b => {
        return { category: b.key, count: b.doc_count };
      });
      callback( null, {
        total_results: _.size( buckets ),
        page: 1,
        per_page: _.keys( buckets ).length,
        results: _.sortBy( buckets, b => {
          return -1 * b.count;
        })
      });
    });
  }

  static resultsForRequest( req, callback ) {
    IdentificationsController.elasticResults( req, ( err, data ) => {
      if( err ) { return callback( err ); }
      var ids = _.map( data.hits.hits, h => {
        return new Identification( h._source );
      });
      if( err ) { return callback( err ); }
      callback( null, {
        total_results: data.hits.total,
        page: Number( req.elastic_query.page ),
        per_page: Number( req.elastic_query.per_page ),
        results: ids
      });
    });
  }

  static elasticResults( req, callback ) {
    IdentificationsController.reqToElasticQuery( req, ( err, query ) => {
      if( err ) { return callback( err ); }
      ESModel.elasticResults( req, query, "identifications", { }, callback );
    });
  }

  static reqToElasticQuery( req, callback ) {
    var p = req.query;
    // clone the params object
    var params = _.extend( { }, p );
    var search_filters = [ ];
    var inverse_filters = [ ];

    if( !_.isEmpty( params.user_id ) && !Number( params.user_id ) &&
        !_.isArray( params.user_id )) {
      params.user_login = params.user_id;
      delete params.user_id;
    }

    if( params.current !== "false" && params.current !== "any" ) {
      params.current = "true";
    }
    _.each([
      { http_param: "current_taxon", es_field: "current_taxon" },
      { http_param: "own_observation", es_field: "own_observation" },
      { http_param: "taxon_active", es_field: "taxon.is_active" },
      { http_param: "observation_taxon_active", es_field: "observation.taxon.is_active" }
    ], filter => {
      if( params[ filter.http_param ] == "true" ) {
        search_filters.push( esClient.termFilter( filter.es_field, true ) );
      } else if( params[ filter.http_param ] == "false" ) {
        search_filters.push( esClient.termFilter( filter.es_field, false ) );
      }
    });

    _.each([
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
      { http_param: "observation_iconic_taxon_id", es_field: "observation.taxon.iconic_taxon_id" }
    ], filter => {
      if( params[ filter.http_param ] && params[ filter.http_param ] != "any" ) {
        search_filters.push( esClient.termFilter(
          filter.es_field, params[ filter.http_param ] ) );
      }
    });

    _.each([
      { http_param: "is_change", es_field: "taxon_change.id" }
    ], filter => {
      var f = { exists: { field: filter.es_field } };
      if( params[ filter.http_param ] == "true" ) {
        search_filters.push( f );
      } else if( params[ filter.http_param ] == "false" ) {
        inverse_filters.push( f );
      }
    });

    if( params.hrank || params.lrank ) {
      search_filters.push({ range: { "taxon.rank_level": {
        gte: Taxon.ranks[ params.lrank ] || 0,
        lte: Taxon.ranks[ params.hrank ] || 100 } } });
    }

    if( params.observation_hrank || params.observation_lrank ) {
      search_filters.push({ range: { "observation.taxon.rank_level": {
        gte: Taxon.ranks[ params.observation_lrank ] || 0,
        lte: Taxon.ranks[ params.observation_hrank ] || 100 } } });
    }

    if( params.without_taxon_id ) {
      inverse_filters.push( { terms: {
        "taxon.ancestor_ids": util.paramArray( params.without_taxon_id ) }
      });
    }
    if( params.without_observation_taxon_id ) {
      inverse_filters.push( { terms: {
        "observation.taxon.ancestor_ids": util.paramArray( params.without_observation_taxon_id ) }
      });
    }

    var drf;
    if(( drf = util.dateRangeFilter( "created_at", params.d1, params.d2 ))) {
      search_filters.push( drf );
    }
    if(( drf = util.dateRangeFilter( "observation.time_observed_at", params.observed_d1,
                 params.observed_d2, "observation.observed_on_details.date" ))) {
      search_filters.push( drf );
    }
    if(( drf = util.dateRangeFilter( "observation.created_at", params.observation_created_d1,
                 params.observation_created_d2 ))) {
      search_filters.push( drf );
    }

    // sort defaults to created at descending
    var sort_order = ( params.order || "desc" ).toLowerCase( );
    var sort;
    switch( params.order_by ) {
      case "id":
        sort = { id: sort_order };
        break;
      default:
        sort = { created_at: sort_order };
    }

    var elasticQuery = {
      filters: search_filters,
      inverse_filters: inverse_filters,
      per_page: InaturalistAPI.perPage( req, { default: 30, max: 200 } ),
      page: req.query.page || 1,
      sort: sort
    };
    callback( null, elasticQuery );
  }

  static leafCounts( req, callback ) {
    var field = "taxon.min_species_ancestry";
    if( req.query.taxon_of !== "identification" ) {
      field = `observation.${ field }`;
    }
    ESModel.ancestriesSpeciesCounts( req, field,
      IdentificationsController.elasticResults, callback );
  }

  static speciesCounts( req, options, callback ) {
    IdentificationsController.leafCounts( req, ( err, leafCounts ) => {
      if( err ) { return callback( err ); }
      TaxaController.speciesCountsResponse( req, leafCounts, options, callback );
    });
  }

  static similarSpecies( req, callback ) {
    if( !req.query.taxon_id ) {
      return callback({ error: "Missing required parameter `taxon_id`", status: 422 });
    }
    Taxon.findByID( req.query.taxon_id, ( err, taxon ) => {
      if( err ) { return callback( err ); }
      if( !taxon ) {
        return callback({ error: "Unknown taxon "+ req.query.taxon_id, status: 422 });
      }
      var sharedQuery = {
        current: "any",
        current_taxon: "false",
        ttl: req.query.ttl,
        locale: req.query.locale,
        preferred_place_id: req.query.preferred_place_id,
        place_id: req.query.place_id
      };
      var idQuery = _.extend( { }, sharedQuery, {
        taxon_id: req.query.taxon_id,
        observation_iconic_taxon_id: taxon.iconic_taxon_id,
        without_observation_taxon_id: req.query.taxon_id,
        observation_rank: "species",
        observation_taxon_active: "true"
      } );
      // return species which are commonly mis-ID'd as this species
      IdentificationsController.speciesCounts( { query: idQuery, inat: req.inat }, { photos: true }, ( err, rsp1 ) => {
        idQuery = _.extend( { }, sharedQuery, {
          observation_taxon_id: req.query.taxon_id,
          iconic_taxon_id: taxon.iconic_taxon_id,
          without_taxon_id: req.query.taxon_id,
          rank: "species",
          taxon_of: "identification",
          taxon_active: "true"
        } );
        // return incorrect species IDs which end up as this species
        IdentificationsController.speciesCounts( { query: idQuery, inat: req.inat }, { photos: true }, ( err, rsp2 ) => {
          if( err ) { return callback( err ); }
          var results = rsp1.results;
          _.each( rsp2.results, res2 => {
            var same = _.find( results, r => r.taxon.id === res2.taxon.id );
            if( same ) {
              // the taxon was in both list, so combine the counts
              same.count += res2.count;
            } else {
              results.push( res2 );
            }
          });
          callback( null, {
            total_results: results.length,
            page: 1,
            per_page: results.length,
            results: _.sortBy( results, function( r ) {
              return -1 * r.count;
            })
          });
        });
      });
    });
  }

  static identifiers( req, callback ) {
    var countQuery = _.extend( { }, req.query );
    var perPage = req.query.per_page || 500;
    countQuery.aggs = {
      total: { cardinality: { field: "user.id", precision_threshold: 10000 } },
      users: { terms: { field: "user.id", size: perPage } }
    };
    ESModel.userAggregationResponse( req, countQuery,
      IdentificationsController.elasticResults, callback );
  }

  static observers( req, callback ) {
    var countQuery = _.extend( { }, req.query );
    var perPage = req.query.per_page || 500;
    countQuery.aggs = {
      total: { cardinality: { field: "observation.user.id", precision_threshold: 10000 } },
      users: { terms: { field: "observation.user.id", size: perPage } }
    };
    ESModel.userAggregationResponse( req, countQuery,
      IdentificationsController.elasticResults, callback );
  }

  static recentTaxa( req, callback ) {
    const maxAggregations = 500;
    let page = Number( req.query.page || 1);
    page = page < 1 ? 1 : page;
    let perPage = Number( req.query.per_page || 10 );
    perPage = perPage > maxAggregations ? maxAggregations : perPage;
    var countQuery = _.extend( { }, req.query, {
      current: "true",
      current_taxon: "true",
      taxon_active: "true",
      is_change: "false"
    });
    countQuery.aggs = {
      total: { cardinality: { field: "taxon.min_species_ancestors.id", precision_threshold: 10000 } },
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
    var countReq = _.extend( { }, req, { query: countQuery });
    IdentificationsController.elasticResults( countReq, ( err, data ) => {
      if( err ) { return callback( err ); }
      var buckets = _.map( data.aggregations.taxa.buckets, function( b ) {
        return { taxon_id: b.key, identification_id: Number(b.earliest.value) };
      });
      var localeOpts = util.localeOpts( req );
      var prepareTaxon = function( t ) {
        t.prepareForResponse( localeOpts );
      }
      var taxonOpts = { modifier: prepareTaxon,
        filters: [ { term: { is_active: true } } ],
        source: { excludes: [ "photos", "taxon_photos" ] } };
      const start = ( page - 1 ) * perPage;
      ESModel.fetchBelongsTo( buckets, Taxon, taxonOpts, function( err ) {
        if( err ) { return callback( err ); }
        buckets = _.reject( buckets, b => {
          if( !b.taxon ) { return true; }
          if( req.query.taxon_id && !_.includes( b.taxon.ancestor_ids, req.query.taxon_id ) ) {
            return true;
          }
        } );
        let bucketsPage = _.sortBy( buckets, function( b ) {
          return -1 * b.created_at;
        } ).slice( start, start + perPage );
        ESModel.fetchBelongsTo( bucketsPage, Identification, { }, function( err ) {
          if( err ) { return callback( err ); }
          var idents = _.map( bucketsPage, b => b.identification );
          const obsOpts = {
            source: {
              includes: [ "id", "taxon", "photos", "user" ]
            }
          };
          ESModel.fetchBelongsTo( idents, Observation, obsOpts, function( err ) {
            if( err ) { return callback( err ); }
            ESModel.fetchBelongsTo( idents, User, { }, function( err ) {
              if( err ) { return callback( err ); }
              ESModel.fetchBelongsTo( idents.map( i => i.observation ), User, { }, function ( err ) {
                if( err ) { return callback( err ); }
                ESModel.fetchBelongsTo( idents.map( i => i.observation ), Taxon, taxonOpts, function( err ) {
                  if( err ) { return callback( err ); }
                  callback( null, {
                    total_results: buckets.length,
                    page,
                    per_page: perPage,
                    all_results_available: buckets.length < maxAggregations,
                    results: bucketsPage
                  } );
                } );
              } );
            } );
          } );
        } );
      } );
    } );
  }

};

module.exports = IdentificationsController;
