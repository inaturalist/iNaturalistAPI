const _ = require( "lodash" );
const md5 = require( "md5" );
const path = require( "path" );
const fs = require( "fs" );
const esClient = require( "../es_client" );
const Model = require( "./model" );
const User = require( "./user" );

let CachemanCache;

// use Cacheman to cache some data as long as the cache directory exists
const cacheDir = path.join( path.dirname( fs.realpathSync( __filename ) ), "../../cache" );
if ( fs.existsSync( cacheDir ) ) {
  const CachemanFile = require( "cacheman-file" ); // eslint-disable-line global-require
  CachemanCache = new CachemanFile( { tmpDir: cacheDir } );
}

const ESModel = class ESModel {
  static fetchResultsHashByIDs( ids, model, options, callback ) {
    if ( _.isEmpty( ids ) ) { return void callback( ); }
    const optionsFilters = options.filters || [];
    let should;
    // we allow string "slugs" to be used in params like `project_id`, but ES
    // throws an error when searching numeric fields with strings. Make sure to
    // only search ID fields with the numeric values and slug with the rest
    if ( options.searchSlug ) {
      const numericIDs = _.filter( ids, id => Number( id ) );
      should = [
        { terms: { id: numericIDs } },
        { terms: { slug: ids } }
      ];
    } else {
      optionsFilters.push( { terms: { id: ids } } );
    }
    esClient.search( model.tableName, {
      body: {
        query: { bool: { filter: optionsFilters, should } },
        size: ids.length,
        _source: options.source,
        script_fields: options.scriptFields
      }
    }, ( err, results ) => {
      if ( err ) { return void callback( err ); }
      const resultsHash = { };
      _.each( results.hits.hits, h => { resultsHash[h._source.id] = h._source; } );
      callback( err, resultsHash );
    } );
  }

  static fetchBelongsTo( objects, model, options, callback ) {
    options = options || { };
    const ids = Model.belongsToIDs( objects, model, options );
    ESModel.fetchResultsHashByIDs( ids, model, options, ( err, resultsHash ) => {
      if ( err ) { return void callback( err ); }
      Model.injectBelongsTo( objects, model, resultsHash, options );
      callback( );
    } );
  }

  static fetchInstancesByIDsObject( idsObject, model, options, callback ) {
    if ( !_.isObject( idsObject ) ) { return void callback( "idsObject must be an object" ); }
    const ids = _.filter( _.keys( idsObject ), k => ( Number( k ) ) );
    ESModel.fetchResultsHashByIDs( ids, model, options, callback );
  }

  static fetchHasMany( objects, InjectModel, foreignKey, options, callback ) {
    options = options || { };
    if ( !_.isArray( objects ) || objects.length === 0 ) {
      return void callback( );
    }
    let ids = _.map( objects, "id" );
    ids = _.filter( _.uniq( ids ), _.identity );
    if ( ids.length === 0 ) { return void callback( ); }
    esClient.search( InjectModel.indexName, {
      body: {
        query: {
          bool: {
            filter: {
              terms: {
                [foreignKey]: ids
              }
            }
          }
        },
        size: 10000,
        _source: options.source,
        script_fields: options.scriptFields
      }
    }, ( err, results ) => {
      if ( err ) { return void callback( err ); }
      const mapping = { };
      _.each( results.hits.hits, h => {
        const primaryKey = _.at( h._source, foreignKey );
        if ( !_.isEmpty( primaryKey ) ) {
          mapping[primaryKey] = mapping[primaryKey] || [];
          mapping[primaryKey].push( new InjectModel( h._source, options.modelOptions ) );
        }
      } );
      _.each( objects, o => {
        // make sure all instances have the attribute, defaulting to an empty array
        o[InjectModel.indexName] = mapping[o.id] || [];
      } );
      callback( err, { } );
    } );
  }

  // this method will check to see if the raw species counts should be cached.
  // It will accept the `verifiable` and `place_id` parameters and cache
  // results with any combinations of those filers. Any additional params
  // will cause the results to not be cached.
  static ancestriesSpeciesCounts( req, field, searchMethod, callback ) {
    let fileCacheKey;
    if ( CachemanCache && searchMethod.name === "observationElasticResults" ) {
      const queryDup = _.pickBy( _.cloneDeep( req.query ), a => ( a !== "any" ) );
      const reqInatDup = _.pickBy( _.cloneDeep( req.inat ), a => ( a !== "any" ) );
      const placeID = reqInatDup.place ? reqInatDup.place.id : null;
      const verifiable = queryDup.verifiable ? queryDup.verifiable : null;
      const qualityGrade = queryDup.quality_grade ? queryDup.quality_grade : null;
      const spam = queryDup.spam ? queryDup.spam : null;
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
      delete queryDup.place_id;
      delete queryDup.spam;
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
        if ( spam ) {
          fileCacheKey += `-sp-${spam}`;
        }
        fileCacheKey = md5( fileCacheKey );
      }
    }

    if ( fileCacheKey ) {
      CachemanCache.get( fileCacheKey, ( err, value ) => {
        if ( err ) { return void callback( err ); }
        if ( value ) {
          return void callback( null, value );
        }
        return void ESModel.ancestriesSpeciesCountsFetch( req,
          field, searchMethod, fileCacheKey, callback );
      } );
    } else {
      return void ESModel.ancestriesSpeciesCountsFetch( req,
        field, searchMethod, null, callback );
    }
  }

  static ancestriesSpeciesCountsFetch( req, field, searchMethod, fileCacheKey, callback ) {
    const countQuery = _.assignIn( { }, req.query, {
      per_page: 0,
      aggs: {
        ancestries: { terms: { field, size: 250000 } }
      }
    } );
    const countReq = _.assignIn( { }, req, { query: countQuery } );
    searchMethod( countReq, ( err, data ) => {
      if ( err ) { return void callback( err ); }
      const knownAncestors = { };
      const possibleLeaves = { };
      _.each( data.aggregations.ancestries.buckets, bucket => {
        const ancestors = bucket.key.split( "," );
        const taxonID = ancestors.pop( );
        possibleLeaves[taxonID] = possibleLeaves[taxonID] || 0;
        possibleLeaves[taxonID] += bucket.doc_count;
        _.each( ancestors, a => { knownAncestors[a] = true; } );
      } );
      const taxonIDs = _.keys( possibleLeaves );
      _.each( taxonIDs, taxonID => {
        if ( knownAncestors[taxonID] ) {
          delete possibleLeaves[taxonID];
        }
      } );
      const leafCounts = _.sortBy( _.map( possibleLeaves, ( v, k ) => (
        { taxon_id: k, count: v }
      ) ), o => o.count * -1 );
      if ( fileCacheKey ) {
        // caching the raw counts (taxonID and count) for 24 hours
        CachemanCache.set( fileCacheKey, leafCounts, 60 * 60 * 24, ( ) => {
          callback( null, leafCounts );
        } );
      } else {
        callback( null, leafCounts );
      }
    } );
  }

  static elasticResults( req, query, index, options, callback ) {
    req.elastic_query = query;
    if ( req.query && req.query.aggs && _.isObject( req.query.aggs ) ) {
      req.elastic_query.aggs = req.query.aggs;
    }
    const searchHash = esClient.searchHash( req.elastic_query );
    if ( options.excludes ) {
      searchHash._source = searchHash._source || { };
      searchHash._source.excludes = options.excludes;
    }
    if ( options.includes ) {
      searchHash._source = searchHash._source || { };
      searchHash._source.includes = options.includes;
    }
    esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_${index}`,
      body: searchHash
    }, callback );
  }

  static userAggregationQuery( req, countQuery, searchMethod, options, callback ) {
    options = options || { };
    countQuery.per_page = 0;
    const countReq = _.assignIn( { }, req, { query: countQuery } );
    searchMethod( countReq, ( err, data ) => {
      if ( err ) { return void callback( err ); }
      ESModel.userAggregationResponse( req, data, options, callback );
    } );
  }

  static userAggregationResponse( req, data, options, callback ) {
    const InaturalistAPI = require( "../inaturalist_api" ); // eslint-disable-line global-require
    const { page, perPage, offset } = InaturalistAPI.paginationData( req,
      options.paginationOptions );
    let aggs = data.aggregations;
    if ( aggs.nested ) {
      aggs = aggs.nested;
    }
    if ( aggs.filtered ) {
      aggs = aggs.filtered;
    }
    if ( !aggs.users ) {
      return void callback( null, {
        total_results: aggs.total.value,
        page,
        per_page: perPage,
        results: []
      } );
    }
    const buckets = _.map( aggs.users.buckets, b => (
      { user_id: b.key, count: b.doc_count }
    ) );
    const results = _.sortBy( buckets, b => -1 * b.count ).slice( offset, offset + perPage );
    ESModel.fetchBelongsTo( results, User, { }, err => {
      if ( err ) { return void callback( err ); }
      callback( null, {
        total_results: aggs.total.value,
        page,
        per_page: perPage,
        results
      } );
    } );
  }
};

module.exports = ESModel;
