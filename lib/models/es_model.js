"use strict";
var _ = require( "underscore" ),
    esClient = require( "../es_client" ),
    Model = require( "./model" ),
    User = require( "./user" ),
    ESModel = { };

var ESModel = class ESModel {
  static fetchBelongsTo( objects, model, options, callback ) {
    var resultsHash = { };
    options = options || { };
    var ids = Model.belongsToIDs( objects, model, options );
    if( !ids ) { return callback( ); }
    var optionsFilters = options.filters || [ ];
    optionsFilters.push( { terms: { id: ids } } );
    esClient.search( model.tableName, { body: {
        query: { bool: { filter: optionsFilters } },
        size: ids.length,
        _source: options.source,
        script_fields: options.scriptFields } },
      function( err, results ) {
        if( err ) { return callback( err ); }
        _.each( results.hits.hits, function( h ) {
          resultsHash[ h._source.id ] = h._source;
        });
        Model.injectBelongsTo( objects, model, resultsHash, options );
        callback( );
    });
  }

  static fetchInstancesByIDsObject( idsObject, model, options, callback ) {
    if( !_.isObject( idsObject ) ) { return callback( "idsObject must be an object"); }
    var optionsFilters = options.filters || [ ];
    var ids = _.filter( _.keys( idsObject ), k => ( Number( k ) ) );
    optionsFilters.push( { terms: { id: ids } } );
    esClient.search( model.tableName,
      { body: { query: { bool: { filter: optionsFilters } },
        size: ids.length, _source: options.source } },
      function( err, results ) {
        if( err ) { return callback( err ); }
        var resultsHash = { };
        _.each( results.hits.hits, function( h ) {
          resultsHash[ h._source.id ] = new model( h._source );
        });
        callback( null, resultsHash );
    });
  }

  static ancestriesSpeciesCounts( req, field, searchMethod, callback ) {
    var countQuery = _.extend( { }, req.query, {
      per_page: 0,
      aggs: {
        ancestries: { terms: { field: field, size: 150000 } }
    }});
    var countReq = _.extend( { }, req, { query: countQuery });
    searchMethod( countReq, ( err, data ) => {
      if( err ) { return callback( err ); }
      var knownAncestors = { },
          possibleLeaves = { },
          ancestors, taxonID;
      _.each( data.aggregations.ancestries.buckets, bucket => {
         ancestors = bucket.key.split(",");
         taxonID = ancestors.pop( );
         possibleLeaves[ taxonID ] = bucket.doc_count;
         _.each( ancestors, function( a ) {
           knownAncestors[ a ] = true;
         });
      });
      var taxonIDs = _.keys( possibleLeaves );
      _.each( taxonIDs, taxonID => {
        if( knownAncestors[ taxonID ] ) {
          delete possibleLeaves[ taxonID ];
        }
      });
      var leafCounts = _.sortBy( _.map( possibleLeaves, ( v, k ) => {
        return { taxon_id: k, count: v };
      }), function( o ) {
        return o.count * -1;
      });
      callback( null, leafCounts );
    });
  }

  static elasticResults( req, query, index, options, callback ) {
    req.elastic_query = query;
    if( req.query.aggs && _.isObject( req.query.aggs ) ) {
      req.elastic_query.aggs = req.query.aggs;
    }
    var searchHash = esClient.searchHash( req.elastic_query );
    if( options.excludes ) {
      searchHash._source = { excludes: options.excludes };
    }
    esClient.connection.search({
      preference: global.config.elasticsearch.preference,
      index: ( process.env.NODE_ENV || global.config.environment ) + "_" + index,
      body: searchHash
    }, callback );
  }

  static userAggregationResponse( req, countQuery, searchMethod, options, callback ) {
    var InaturalistAPI = require( "../inaturalist_api" );
    options = options || { };
    countQuery.per_page = 0;
    var countReq = _.extend( { }, req, { query: countQuery });
    const { page, perPage, offset } = InaturalistAPI.paginationData( req, options.paginationOptions );
    searchMethod( countReq, function( err, data ) {
      if( err ) { return callback( err ); }
      var aggs = data.aggregations;
      if( aggs.nested ) {
        aggs = aggs.nested;
      }
      if( aggs.filtered ) {
        aggs = aggs.filtered;
      }
      if ( !aggs.users ) {
        return callback( null, {
          total_results: aggs.total.value,
          page: page,
          per_page: perPage,
          results: [ ]
        });
      }
      var buckets = _.map( aggs.users.buckets, function( b ) {
        return { user_id: b.key, count: b.doc_count };
      } );
      var results = _.sortBy( buckets, function( b ) {
        return -1 * b.count;
      } ).slice( offset, offset + perPage );
      ESModel.fetchBelongsTo( results, User, { }, err => {
        if( err ) { return callback( err ); }
        callback( null, {
          total_results: aggs.total.value,
          page: page,
          per_page: perPage,
          results: results
        });
      });
    });
  }


}

module.exports = ESModel;
