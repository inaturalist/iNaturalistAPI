"use strict";
var _ = require( "underscore" ),
    identifications = require( "inaturalistjs" ).identifications,
    util = require( "../../util" ),
    esClient = require( "../../es_client" ),
    ESModel = require( "../../models/es_model" ),
    Identification = require( "../../models/identification" ),
    Observation = require( "../../models/observation" ),
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
        return { categories: b.key, count: b.doc_count };
      });
      if( err ) { return callback( err ); }
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
      var obs = _.map( data.hits.hits, h => {
        return new Identification( h._source );
      });
      if( err ) { return callback( err ); }
      callback( null, {
        total_results: data.hits.total,
        page: Number( req.elastic_query.page ),
        per_page: Number( req.elastic_query.per_page ),
        results: obs
      });
    });
  }

  static elasticResults( req, callback ) {
    IdentificationsController.reqToElasticQuery( req, ( err, query ) => {
      req.elastic_query = query;
      if( req.query.aggs && _.isObject( req.query.aggs ) ) {
        req.elastic_query.aggs = req.query.aggs;
      }
      var searchHash = esClient.searchHash( req.elastic_query );
      esClient.connection.search({
        preference: global.config.elasticsearch.preference || "_local",
        index: ( process.env.NODE_ENV || global.config.environment ) + "_identifications",
        body: searchHash,
        searchType: ( searchHash.size === 0 ? "count" : null )
      }, callback );
    });
  }

  static reqToElasticQuery( req, callback ) {
    var p = req.query;
    // clone the params object
    var params = _.extend( { }, p );
    var search_filters = [ ];

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
      { http_param: "own_observation", es_field: "own_observation" }
    ], filter => {
      if( params[ filter.http_param ] == "true" ) {
        search_filters.push( esClient.termFilter( filter.es_field, true ) );
      } else if( params[ filter.http_param ] == "false" ) {
        search_filters.push( esClient.termFilter( filter.es_field, false ) );
      }
    });


    _.each([
      { http_param: "id", es_field: "id" },
      { http_param: "rank", es_field: "taxon.rank" },
      { http_param: "user_id", es_field: "user.id" },
      { http_param: "user_login", es_field: "user.login" },
      { http_param: "current", es_field: "current" },
      { http_param: "taxon_id", es_field: "taxon.ancestor_ids" },
      { http_param: "observation_taxon_id", es_field: "observation.taxon.ancestor_ids" }

    ], filter => {
      if( params[ filter.http_param ] && params[ filter.http_param ] != "any" ) {
        search_filters.push( esClient.termFilter(
          filter.es_field, params[ filter.http_param ] ) );
      }
    });

    if( params.without_taxon_id ) {
      search_filters.push( { not: {
        terms: { "taxon.ancestor_ids": util.paramArray( params.without_taxon_id ) }
      }});
    }
    if( params.without_observation_taxon_id ) {
      search_filters.push( { not: {
        terms: { "observation.taxon.ancestor_ids": util.paramArray( params.without_observation_taxon_id ) }
      }});
    }

    // sort defaults to created at descending
    var sort_order = ( params.order || "desc" ).toLowerCase( );
    var sort = { created_at: sort_order };

    var elasticQuery = {
      filters: search_filters,
      per_page: ( req.query.per_page || req.query.per_page === 0) ?
        req.query.per_page : 30,
      page: req.query.page || 1,
      sort: sort
    };
    callback( null, elasticQuery );
  }

};

module.exports = IdentificationsController;
