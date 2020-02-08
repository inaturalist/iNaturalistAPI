const _ = require( "lodash" );
const PromisePool = require( "es6-promise-pool" );
const CachemanCache = require( "../cacheman_cache" );
const esClient = require( "../es_client" );
const util = require( "../util" );
const Model = require( "./model" );
const User = require( "./user" );

const ESModel = class ESModel {
  static async fetchResultsHashByIDs( ids, model, options ) {
    // TODO: werid return value
    if ( _.isEmpty( ids ) ) { return { }; }
    const optionsFilters = _.cloneDeep( options.filters || [] );
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
    const response = await esClient.searchAsync( model.tableName, {
      body: {
        query: { bool: { filter: optionsFilters, should } },
        size: ids.length,
        _source: options.source,
        script_fields: options.scriptFields
      }
    } );
    const resultsHash = { };
    _.each( response.hits.hits, h => { resultsHash[h._source.id] = h._source; } );
    return resultsHash;
  }

  static fetchBelongsTo( objects, model, options, callback ) {
    options = options || { };
    const ids = Model.belongsToIDs( objects, model, options );
    const chunks = _.chunk( ids, 200 );
    const promiseProducer = ( ) => {
      const chunk = chunks.shift( );
      if ( !chunk ) {
        return null;
      }
      return ESModel.fetchBelongsToSub( objects, chunk, model, options );
    };
    const pool = new PromisePool( promiseProducer, 3 );
    pool.start( ).then( ( ) => {
      callback( );
    } ).catch( e => {
      callback( e );
    } );
  }

  static fetchBelongsToAsync( objects, model, options ) {
    return new Promise( ( resolve, reject ) => {
      ESModel.fetchBelongsTo( objects, model, options, err => {
        if ( err ) { return void reject( err ); }
        resolve( );
      } );
    } );
  }

  static async fetchBelongsToSub( objects, ids, model, options ) {
    options = options || { };
    const resultsHash = await ESModel.fetchResultsHashByIDs( ids, model, options );
    Model.injectBelongsTo( objects, model, resultsHash, options );
  }


  static async fetchInstancesByIDsObject( idsObject, model, options ) {
    if ( !_.isObject( idsObject ) ) {
      throw new Error( "idsObject must be an object" );
    }
    const ids = _.filter( _.keys( idsObject ), k => ( Number( k ) ) );
    return ESModel.fetchResultsHashByIDs( ids, model, options );
  }

  static async fetchHasMany( objects, InjectModel, foreignKey, options ) {
    options = options || { };
    if ( !_.isArray( objects ) || objects.length === 0 ) {
      return;
    }
    let ids = _.map( objects, "id" );
    ids = _.filter( _.uniq( ids ), _.identity );
    if ( ids.length === 0 ) { return; }

    const chunks = _.chunk( ids, 200 );
    const promiseProducer = ( ) => {
      const chunk = chunks.shift( );
      if ( !chunk ) {
        return null;
      }
      return ESModel.fetchHasManySub( objects, chunk, InjectModel, foreignKey, options );
    };
    const pool = new PromisePool( promiseProducer, 3 );
    await pool.start( );
  }

  static async fetchHasManySub( objects, ids, InjectModel, foreignKey, options ) {
    if ( _.isEmpty( ids ) ) { return; }
    const response = await esClient.searchAsync( InjectModel.indexName, {
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
        size: 5000,
        _source: options.source,
        script_fields: options.scriptFields
      }
    } );
    const mapping = { };
    _.each( response.hits.hits, h => {
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
  }

  // this method will check to see if the raw species counts should be cached.
  // It will accept the `verifiable` and `place_id` parameters and cache
  // results with any combinations of those filers. Any additional params
  // will cause the results to not be cached.
  static ancestriesSpeciesCounts( req, field, searchMethod, callback ) {
    let fileCacheKey;
    if ( searchMethod.name === "observationElasticResults" ) {
      fileCacheKey = util.observationSearchRequestCacheKey(
        req, "ESModel.ancestriesSpeciesCounts", { ignorePagination: true }
      );
    }
    CachemanCache.cachedOrFetchFile( fileCacheKey, ( ) => {
      ESModel.ancestriesSpeciesCountsFetch( req, field, searchMethod ).then( leafCounts => {
        CachemanCache.cachedCallbackFile( fileCacheKey,
          60 * 60 * 24, callback )( null, leafCounts );
      } );
    }, callback );
  }

  static ancestriesSpeciesCountsFetch( req, field, searchMethod ) {
    return new Promise( ( resolve, reject ) => {
      const countQuery = _.assignIn( { }, req.query, {
        per_page: 0,
        aggs: {
          ancestries: { terms: { field, size: 300000 } }
        }
      } );
      const countReq = _.assignIn( { }, req, { query: countQuery } );
      searchMethod( countReq ).then( data => {
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
        resolve( leafCounts );
      } ).catch( reject );
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
    if ( options.track_total_hits ) {
      searchHash.track_total_hits = true;
    }
    esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_${index}`,
      body: searchHash
    }, callback );
  }

  static async elasticResultsAsync( req, query, index, options = { } ) {
    return new Promise( ( resolve, reject ) => {
      ESModel.elasticResults( req, query, index, options, ( err, response ) => {
        if ( err ) { return void reject( err ); }
        resolve( response );
      } );
    } );
  }

  static userAggregationQuery( req, countQuery, searchMethod, options, callback ) {
    options = options || { };
    countQuery.per_page = 0;
    const countReq = _.assignIn( { }, req, { query: countQuery } );
    searchMethod( countReq ).then( data => {
      ESModel.userAggregationResponse( req, data, options, callback );
    } ).catch( callback );
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
