const _ = require( "lodash" );
const PromisePool = require( "es6-promise-pool" );
const RedisCacheClient = require( "../redis_cache_client" );
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
    const fetchingOnlyIDs = util.filtersOnlyOnID( optionsFilters );
    if ( fetchingOnlyIDs && _.isEmpty( should ) ) {
      const source = util.sourceParams( options.source );
      const getResponse = await ESModel.mget( fetchingOnlyIDs, model.tableName, { source } );
      const resultsHash = { };
      _.each( getResponse.docs, h => {
        if ( h._source ) {
          resultsHash[h._source.id] = h._source;
        }
      } );
      return resultsHash;
    }
    const response = await esClient.search( model.tableName, {
      body: {
        query: { bool: { filter: optionsFilters, should } },
        size: ids.length,
        _source: options.source
      }
    } );
    const resultsHash = { };
    _.each( response.hits.hits, h => { resultsHash[h._source.id] = h._source; } );
    return resultsHash;
  }

  static async findByUuids( uuids, model, options = {} ) {
    if ( _.isEmpty( uuids ) ) { return { }; }
    const optionsFilters = _.cloneDeep( options.filters || [] );
    optionsFilters.push( { terms: { uuid: uuids } } );
    const response = await esClient.search( model.tableName, {
      body: {
        query: { bool: { filter: optionsFilters } },
        size: uuids.length,
        _source: options.source
      }
    } );
    const resultsHash = { };
    _.each( response.hits.hits, h => { resultsHash[h._source.uuid] = h._source; } );
    return resultsHash;
  }

  static async fetchBelongsTo( objects, model, options = { } ) {
    options = options || { };
    const ids = Model.belongsToIDs( objects, model, options );
    const chunks = _.chunk( ids, options.batchSize || 200 );
    const promiseProducer = ( ) => {
      const chunk = chunks.shift( );
      if ( !chunk ) {
        return null;
      }
      return ESModel.fetchBelongsToSub( objects, chunk, model, options );
    };
    const pool = new PromisePool( promiseProducer, 4 );
    await pool.start( );
  }

  static async fetchBelongsToSub( objects, ids, model, options = { } ) {
    options = options || { };
    const resultsHash = await ESModel.fetchResultsHashByIDs( ids, model, options );
    Model.injectBelongsTo( objects, model, resultsHash, options );
  }

  static async fetchInstancesByIDsObject( idsObject, model, options = { } ) {
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
    const response = await esClient.search( InjectModel.indexName, {
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
        _source: options.source
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
  static async ancestriesSpeciesCounts( req, field, searchMethod ) {
    const cacheSeconds = 60 * 60 * 2;
    let redisCacheKey;
    if ( searchMethod.name === "observationElasticResults" ) {
      redisCacheKey = util.observationSearchRequestCacheKey(
        req, "ESModel.ancestriesSpeciesCounts", { ignorePagination: true }
      );
    }
    const countRequest = async ( ) => ESModel
      .ancestriesSpeciesCountsFetch( req, field, searchMethod );
    return RedisCacheClient.getOrSetJSON( redisCacheKey, cacheSeconds, countRequest );
  }

  static async ancestriesSpeciesCountsFetch( req, field, searchMethod ) {
    const countQuery = _.assignIn( { }, req.query, {
      per_page: 0,
      skip_total_hits: true,
      aggs: {
        ancestries: { terms: { field, size: 400000 } }
      }
    } );
    const countReq = _.assignIn( { }, req, { query: countQuery } );
    const data = await searchMethod( countReq );
    const possibleLeaves = { };
    const resultTaxonIDs = _.map( data.aggregations.ancestries.buckets, "key" );
    const Taxon = require( "./taxon" ); // eslint-disable-line global-require
    const knownAncestors = await Taxon.ancestorsWithin( resultTaxonIDs );
    _.each( data.aggregations.ancestries.buckets, bucket => {
      const taxonID = bucket.key;
      if ( !knownAncestors[taxonID] ) {
        possibleLeaves[taxonID] = possibleLeaves[taxonID] || 0;
        possibleLeaves[taxonID] += bucket.doc_count;
      }
    } );
    const leafCounts = _.sortBy( _.map( possibleLeaves, ( v, k ) => (
      { taxon_id: k, count: v }
    ) ), o => o.count * -1 );
    return leafCounts;
  }

  static async elasticResults( req, query, index, options = { } ) {
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
    return esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_${index}`,
      body: searchHash
    } );
  }

  static async mget( ids, index, options = { } ) {
    let mgetParams = {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_${index}`,
      body: { ids }
    };
    if ( !_.isEmpty( options.source ) ) {
      mgetParams = Object.assign( mgetParams, options.source );
    }
    return esClient.connection.mget( mgetParams );
  }

  static async mgetResults( ids, index, options = { } ) {
    const getResponse = await ESModel.mget( ids, index, options );
    if ( !_.isEmpty( options.excludingUserIDs ) ) {
      getResponse.docs = _.filter( getResponse.docs,
        d => !( d._source && d._source.user && d._source.user.id
          && _.includes( options.excludingUserIDs, d._source.user.id ) ) );
    }
    const docs = _.filter( getResponse.docs, "_source" );
    return {
      hits: {
        total: {
          value: _.size( docs )
        },
        hits: docs
      }
    };
  }

  static async userAggregationQuery( req, countQuery, searchMethod, options ) {
    options = options || { };
    countQuery.per_page = 0;
    countQuery.skip_total_hits = true;
    const countReq = _.assignIn( { }, req, { query: countQuery } );
    const data = await searchMethod( countReq );
    return ESModel.userAggregationResponse( req, data, options );
  }

  static async userAggregationResponse( req, data, options ) {
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
      return {
        total_results: aggs.total.value,
        page,
        per_page: perPage,
        results: []
      };
    }
    const buckets = _.map( aggs.users.buckets, b => (
      { user_id: b.key, count: b.doc_count }
    ) );
    const results = _.sortBy( buckets, b => -1 * b.count ).slice( offset, offset + perPage );
    await ESModel.fetchBelongsTo( results, User );
    return {
      total_results: aggs.total.value,
      page,
      per_page: perPage,
      results
    };
  }

  static async userObservedTaxonIDsCached( userID ) {
    const cacheSeconds = 60 * 60;
    const redisCacheKey = `taxa-observed-by-${userID}`;
    const countRequest = async ( ) => ESModel.userObservedTaxonIDs( userID );
    return RedisCacheClient.getOrSetJSON( redisCacheKey, cacheSeconds, countRequest );
  }

  static async userObservedTaxonIDs( userID ) {
    if ( !userID ) {
      return null;
    }
    const countQuery = {
      filters: [
        { term: { "user.id": userID } }
      ],
      size: 0,
      aggs: {
        ancestries: {
          terms: {
            field: "taxon.ancestor_ids",
            size: 400000
          }
        }
      }
    };
    const data = await ESModel.elasticResults( { }, countQuery, "observations" );
    const observedTaxonIDs = _.map( data.aggregations.ancestries.buckets, "key" );
    if ( _.isEmpty( observedTaxonIDs ) ) {
      return [-1];
    }
    return observedTaxonIDs;
  }
};

module.exports = ESModel;
