"use strict";
var _ = require( "lodash" ),
    md5 = require( "md5" ),
    path = require( "path" ),
    fs = require( "fs" ),
    esClient = require( "../es_client" ),
    Model = require( "./model" ),
    User = require( "./user" ),
    CachemanCache;

// use Cacheman to cache some data as long as the cache directory exists
var cacheDir = path.join( path.dirname( fs.realpathSync( __filename ) ), "../../cache" );
if ( fs.existsSync( cacheDir ) ) {
  const CachemanFile = require( "cacheman-file" );
  CachemanCache = new CachemanFile({ tmpDir: cacheDir });
}

var ESModel = class ESModel {

  static fetchResultsHashByIDs( ids, model, options, callback ) {
    if( _.isEmpty( ids ) ) { return callback( ); }
    var optionsFilters = options.filters || [ ];
    var should;
    // we allow string "slugs" to be used in params like `project_id`, but ES
    // throws an error when searching numeric fields with strings. Make sure to
    // only search ID fields with the numeric values and slug with the rest
    if ( options.searchSlug ) {
      var numericIDs = _.filter( ids, id => Number( id ) );
      should = [
        { terms: { id: numericIDs } },
        { terms: { slug: ids } }
      ];
    } else {
      optionsFilters.push( { terms: { id: ids } } );
    }
    esClient.search( model.tableName, { body: {
        query: { bool: { filter: optionsFilters, should: should } },
        size: ids.length,
        _source: options.source,
        script_fields: options.scriptFields } },
      function( err, results ) {
        if( err ) { return callback( err ); }
        var resultsHash = { };
        _.each( results.hits.hits, function( h ) {
          resultsHash[ h._source.id ] = h._source;
        });
        callback( err, resultsHash );
    });
  }

  static fetchBelongsTo( objects, model, options, callback ) {
    options = options || { };
    var ids = Model.belongsToIDs( objects, model, options );
    ESModel.fetchResultsHashByIDs( ids, model, options, ( err, resultsHash ) => {
      if( err ) { return callback( err ); }
      Model.injectBelongsTo( objects, model, resultsHash, options );
      callback( );
    });
  }

  static fetchInstancesByIDsObject( idsObject, model, options, callback ) {
    if( !_.isObject( idsObject ) ) { return callback( "idsObject must be an object"); }
    var ids = _.filter( _.keys( idsObject ), k => ( Number( k ) ) );
    ESModel.fetchResultsHashByIDs( ids, model, options, callback );
  }

  static fetchHasMany( objects, model, foreign_key, options, callback ) {
    options = options || { };
    if( !_.isArray( objects ) || objects.length == 0 ) {
      return callback( );
    }
    var ids = _.map( objects, function( o ) { return o.id; } );
    ids = _.filter( _.uniq( ids ), _.identity );
    if( ids.length == 0 ) { return callback( ); }
    esClient.search( model.indexName, {
      body: {
        query: {
          bool: {
            filter: {
              terms: {
                [foreign_key]: ids
              }
            }
          }
        },
        size: 10000,
        _source: options.source,
        script_fields: options.scriptFields
      } },
      function( err, results ) {
        if( err ) { return callback( err ); }
        let mapping = { };
        _.each( results.hits.hits, function( h ) {
          const primaryKey = _.at( h._source, foreign_key );
          if ( !_.isEmpty( primaryKey ) ) {
            mapping[primaryKey] = mapping[primaryKey] || [ ];
            mapping[primaryKey].push( new model( h._source, options.modelOptions ) );
          }
        });
        _.each( objects, o => {
          if ( mapping[o.id] ) {
            o[model.indexName] = mapping[o.id];
          }
        });
        callback( err, { } );
    });
  }

  // this method will check to see if the raw species counts should be cached.
  // It will accept the `verifiable` and `place_id` parameters and cache
  // results with any combinations of those filers. Any additional params
  // will cause the results to not be cached.
  static ancestriesSpeciesCounts( req, field, searchMethod, callback ) {
    let fileCacheKey;
    if ( CachemanCache && searchMethod.name === "observationElasticResults" ) {
      let queryDup = _.pickBy( _.cloneDeep( req.query ), a => ( a !== "any" && !_.isEmpty( a ) ) );
      let reqInatDup = _.pickBy( _.cloneDeep( req.inat ), a => ( a !== "any" && !_.isEmpty( a ) ) );
      let placeID = reqInatDup.place ? reqInatDup.place.id : null;
      let verifiable = queryDup.verifiable ? queryDup.verifiable : null;
      let qualityGrade = queryDup.quality_grade ? queryDup.quality_grade : null;
      // remove query params that won't affect the un-localized result,
      // and remove all the params we are using in the cache key
      delete queryDup.page;
      delete queryDup.per_page;
      delete queryDup.locale;
      delete queryDup.preferred_place_id;
      delete queryDup.ttl;
      delete queryDup.verifiable;
      delete queryDup.ordered_by;
      delete queryDup.order;
      delete queryDup.return_bounds;
      delete queryDup.quality_grade;
      delete reqInatDup.preferredPlace;
      delete reqInatDup.place;
      if ( _.isEmpty( queryDup ) && _.isEmpty( reqInatDup ) ) {
        fileCacheKey = "speciesCounts";
        if ( verifiable ) {
          fileCacheKey += `-v-${verifiable}`;
        }
        if ( placeID ) {
          fileCacheKey += `-p-${placeID}`;
        }
        if ( qualityGrade ) {
          fileCacheKey += `-q-${qualityGrade}`;
        }
        fileCacheKey = md5( fileCacheKey );
      }
    }

    if ( fileCacheKey ) {
      CachemanCache.get( fileCacheKey, ( err, value ) => {
        if ( err ) { return callback( err ); }
        if ( value ) {
          return callback( null, value );
        } else {
          return ESModel.ancestriesSpeciesCountsFetch( req, field, searchMethod, fileCacheKey, callback );
        }
      });
    } else {
      return ESModel.ancestriesSpeciesCountsFetch( req, field, searchMethod, null, callback );
    }
  }

  static ancestriesSpeciesCountsFetch( req, field, searchMethod, fileCacheKey, callback ) {
    var countQuery = _.assignIn( { }, req.query, {
      per_page: 0,
      aggs: {
        ancestries: { terms: { field: field, size: 250000 } }
    }});
    var countReq = _.assignIn( { }, req, { query: countQuery });
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
      if ( fileCacheKey ) {
        // caching the raw counts (taxonID and count) for 24 hours
        CachemanCache.set( fileCacheKey, leafCounts, 60 * 60 * 24, ( ) => {
          callback( null, leafCounts );
        });
      } else {
        callback( null, leafCounts );
      }
    });
  }

  static elasticResults( req, query, index, options, callback ) {
    req.elastic_query = query;
    if( req.query.aggs && _.isObject( req.query.aggs ) ) {
      req.elastic_query.aggs = req.query.aggs;
    }
    var searchHash = esClient.searchHash( req.elastic_query );
    if( options.excludes ) {
      searchHash._source = searchHash._source || { };
      searchHash._source.excludes = options.excludes;
    }
    if( options.includes ) {
      searchHash._source = searchHash._source || { };
      searchHash._source.includes = options.includes;
    }
    esClient.connection.search({
      preference: global.config.elasticsearch.preference,
      index: ( process.env.NODE_ENV || global.config.environment ) + "_" + index,
      body: searchHash
    }, callback );
  }

  static userAggregationQuery( req, countQuery, searchMethod, options, callback ) {
    options = options || { };
    countQuery.per_page = 0;
    var countReq = _.assignIn( { }, req, { query: countQuery });
    searchMethod( countReq, function( err, data ) {
      if( err ) { return callback( err ); }
      ESModel.userAggregationResponse( req, data, options, callback );
    });
  }

  static userAggregationResponse( req, data, options, callback ) {
    const InaturalistAPI = require( "../inaturalist_api" );
    const { page, perPage, offset } = InaturalistAPI.paginationData( req, options.paginationOptions );
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
  }

}

module.exports = ESModel;
