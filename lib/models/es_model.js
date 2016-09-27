"use strict";
var _ = require( "underscore" ),
    esClient = require( "../es_client" ),
    Model = require( "./model" ),
    util = require( "../util" ),
    User = require( "./user" ),
    TaxaController = require( "../controllers/v1/taxa_controller" ),
    ESModel = { };

var ESModel = class ESModel {
  static fetchBelongsTo( objects, model, options, callback ) {
    var resultsHash = { };
    var ids = Model.belongsToIDs( objects, model );
    if( !ids ) { return callback( ); }
    esClient.search( model.tableName,
      { body: { query: { terms: { id: ids } }, size: ids.length, _source: options.source } },
      function( err, results ) {
        if( err ) { return callback( err ); }
        _.each( results.hits.hits, function( h ) {
          resultsHash[ h._source.id ] = h._source;
        });
        Model.injectBelongsTo( objects, model, resultsHash, options.modifier );
        callback( );
    });
  }

  static ancestriesSpeciesCounts( req, field, searchMethod, callback ) {
    var countQuery = _.extend( { }, req.query, {
      per_page: 0,
      aggs: {
        ancestries: { terms: { field: field, size: 0 } }
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

  static speciesCountsResponse( req, leafCounts, callback ) {
    var totalResults = leafCounts.length;
    leafCounts = leafCounts.slice( 0, req.query.per_page || 500 );
    var leafCountObject = _.object( _.map( leafCounts, function( c ) {
      return [ c.taxon_id, { count: c.count } ];
    }));
    var filters = [ { terms: { id: _.keys( leafCountObject ) } } ];
    var searchReq = _.extend( { }, req, { query: { is_active : null, size: req.query.per_page || 500,
      locale: req.query.locale } });
    TaxaController.searchQuery( searchReq, { filters: filters }, function( err, response ) {
      if( err ) { return callback( err ); }
      // insert the resulting taxa into the leafCountObject
      _.each( response.results, function( tax ) {
        leafCountObject[ tax.id ].taxon = tax;
      });
      // remove any with missing taxa
      var leafCountArray = _.reject( leafCountObject, function( lc ) {
        if( !lc.taxon ) {
          util.debug( "Taxon missing" )
        }
        return !lc.taxon;
      });
      // sort the results again by count descending
      callback( null, {
        total_results: totalResults,
        page: 1,
        per_page: leafCountArray.length,
        results: _.sortBy( leafCountArray, function( o ) {
          return ( req.query.order === "asc" ? 1 : -1 ) * o.count;
        })
      });
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
      preference: global.config.elasticsearch.preference || "_local",
      index: ( process.env.NODE_ENV || global.config.environment ) + "_" + index,
      body: searchHash,
      searchType: ( searchHash.size === 0 ? "count" : null )
    }, callback );
  }

  static userAggregationResponse( req, countQuery, searchMethod, callback ) {
    countQuery.per_page = 0;
    var countReq = _.extend( { }, req, { query: countQuery });
    searchMethod( countReq, function( err, data ) {
      if( err ) { return callback( err ); }
      var aggs = data.aggregations;
      if( aggs.nested ) {
        aggs = aggs.nested;
      }
      var buckets = _.map( aggs.users.buckets, function( b ) {
        return { user_id: b.key, count: b.doc_count };
      });
      ESModel.fetchBelongsTo( buckets, User, { }, err => {
        if( err ) { return callback( err ); }
        callback( null, {
          total_results: aggs.total.value,
          page: 1,
          per_page: _.keys( buckets ).length,
          results: _.sortBy( buckets, function( b ) {
            return -1 * b.count;
          })
        });
      });
    });
  }


}

module.exports = ESModel;
