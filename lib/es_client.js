const elasticsearch = require( "elasticsearch" );
const _ = require( "lodash" );
const config = require( "../config" );
const util = require( "./util" );

const esClient = { connection: null };
const host = process.env.ELASTICSEARCH_HOST
  || config.elasticsearch.host
  || "127.0.0.1:9200";
const hosts = process.env.ELASTICSEARCH_HOSTS || config.elasticsearch.hosts;
const environment = process.env.NODE_ENV || config.environment;

esClient.connect = ( ) => {
  if ( esClient.connection ) { return esClient.connection; }
  const clientConfig = { log: false };
  if ( hosts ) {
    clientConfig.hosts = _.isArray( hosts ) ? hosts : hosts.split( " " );
  } else {
    clientConfig.host = host;
  }
  clientConfig.suggestCompression = true;
  clientConfig.nodeSelector = "random";
  clientConfig.requestTimeout = 60000;
  clientConfig.maxRetries = 1;
  esClient.connection = new elasticsearch.Client( clientConfig );
  return esClient.connection;
};

esClient.search = async ( index, options ) => {
  options = options || { };
  return esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${environment}_${index}`,
    body: options.body
  } );
};

esClient.compileFilters = filters => {
  if ( !filters || !_.isArray( filters ) ) {
    return [];
  }
  return _.compact( _.map( filters, f => {
    if ( !_.isObject( f ) || _.size( f ) !== 1 ) { return null; }
    if ( f.envelope ) {
      return esClient.envelopeFilter( f );
    }
    return f;
  } ) );
};

esClient.termFilter = ( key, value ) => {
  const filter = { };
  const v = util.paramArray( value );
  if ( _.isArray( v ) ) {
    filter.terms = { };
    filter.terms[key] = v.sort( );
  } else {
    // false and 0 values will end up here
    filter.term = { };
    filter.term[key] = value;
  }
  return filter;
};

esClient.envelopeFilter = filter => {
  if ( !_.isObject( filter ) || !filter.envelope ) { return null; }
  const field = _.keys( filter.envelope )[0];
  const opts = filter.envelope[field];
  if ( !( opts.nelat || opts.nelng || opts.swlat || opts.swlng ) ) { return null; }
  opts.swlng = parseFloat( opts.swlng || -180 );
  opts.swlat = parseFloat( opts.swlat || -90 );
  opts.nelng = parseFloat( opts.nelng || 180 );
  opts.nelat = parseFloat( opts.nelat || 90 );
  if ( opts.swlng < -180 ) { opts.swlng = -180; }
  if ( opts.swlng > 180 ) { opts.swlng = 180; }
  if ( opts.swlat < -90 ) { opts.swlat = -90; }
  if ( opts.swlat > 90 ) { opts.swlat = 90; }
  if ( opts.nelng < -180 ) { opts.nelng = -180; }
  if ( opts.nelng > 180 ) { opts.nelng = 180; }
  if ( opts.nelat < -90 ) { opts.nelat = -90; }
  if ( opts.nelat > 90 ) { opts.nelat = 90; }
  if ( opts.nelng && opts.swlng && opts.nelng < opts.swlng ) {
    // the envelope crosses the dateline. Unfortunately, elasticsearch
    // doesn't handle this well and we need to split the envelope at
    // the dateline and do an OR query
    const originalNElng = opts.nelng;
    return {
      bool: {
        should: [
          esClient.envelopeFilter( _.mapValues( filter, val => {
            val[field].nelng = 180;
            return val;
          } ) ),
          esClient.envelopeFilter( _.mapValues( filter, val => {
            val[field].nelng = originalNElng;
            val[field].swlng = -180;
            return val;
          } ) )
        ]
      }
    };
  }
  const envelope = { geo_shape: { } };
  envelope.geo_shape[field] = {
    shape: {
      type: "envelope",
      coordinates: [
        [opts.swlng, opts.nelat],
        [opts.nelng, opts.swlat]
      ]
    }
  };
  return envelope;
};

esClient.searchHash = elasticQuery => {
  const filters = esClient.compileFilters( elasticQuery.filters );
  const inverseFilters = esClient.compileFilters( elasticQuery.inverse_filters );
  const groupedInverseFilters = esClient.compileFilters( elasticQuery.grouped_inverse_filters );
  let query = { };
  if ( filters.length > 0 || inverseFilters.length > 0 || groupedInverseFilters.length > 0 ) {
    query = { bool: { } };
  }
  if ( filters.length > 0 ) {
    query.bool.filter = filters;
  }

  // Inverse filters select results that fail to pass the filters individually,
  // so !(A || B || C), which is the same as (!A && !B && !C)
  if ( inverseFilters.length > 0 ) {
    query.bool.must_not = inverseFilters;
  }
  // Grouped inverse filters select results that fail to pass the filters as a
  // group, so !(A && B && C), which is the same as (!A || !B || !C) This is for
  // situations like looking for observations in a project that don't pass the
  // project rules. If an observation fails any of the rules, it should be
  // included
  if ( groupedInverseFilters.length > 0 ) {
    query.bool.must_not = query.bool.must_not || [];
    query.bool.must_not.push( {
      bool: {
        filter: groupedInverseFilters
      }
    } );
  }
  if ( !query.bool ) {
    query = { match_all: { } };
  }
  if ( query.bool && elasticQuery.should ) {
    query.bool.should = elasticQuery.should;
  }
  elasticQuery.per_page = ( elasticQuery.per_page || elasticQuery.per_page === 0 )
    ? elasticQuery.per_page : 30;
  // prevent very large per_page values
  if ( elasticQuery.per_page > 10000 ) { elasticQuery.per_page = 30; }
  elasticQuery.page = elasticQuery.page || 1;
  const elasticHash = { };
  if ( elasticQuery.sort ) {
    if ( elasticQuery.sort === "random" ) {
      query = {
        function_score: {
          query,
          random_score: { },
          // This is important because if you just have filters the scores will
          // all be zero. Since the default boost_mode is "multiply," that will
          // be 0 * random_score = 0. Results will be randomish, but they won't
          // be differently random with different requests.
          // This *will* probably cause problems if you're not using filters
          boost_mode: "sum"
        }
      };
    } else {
      elasticHash.sort = elasticQuery.sort;
    }
  }
  elasticHash.query = query;
  if ( elasticQuery.aggs ) { elasticHash.aggs = elasticQuery.aggs; }
  elasticHash.size = ( elasticQuery.size || elasticQuery.size === 0 )
    ? elasticQuery.size : elasticQuery.per_page;
  elasticHash.from = ( elasticQuery.page - 1 ) * elasticQuery.per_page;
  elasticHash.highlight = elasticQuery.highlight;
  elasticHash._source = elasticQuery._source;
  return elasticHash;
};

esClient.deleteIndex = async ( options = { } ) => {
  if ( environment !== "test" ) { return; }
  const response = await esClient.connection.indices
    .exists( { index: `${environment}_${options.name}` } );
  if ( response === true ) {
    await esClient.connection.indices.delete(
      { index: `${environment}_${options.name}` }
    );
  }
};

esClient.createIndexIfNotExists = async ( options = { } ) => {
  if ( environment !== "test" ) { return; }
  const response = await esClient.connection.indices
    .exists( { index: `${environment}_${options.name}` } );
  if ( response === false ) {
    await esClient.createIndex( options );
  }
};

esClient.createIndex = async ( options = { } ) => {
  if ( environment !== "test" ) { return; }
  options.settings = options.settings || { };
  await esClient.connection.indices.create( {
    index: `${environment}_${options.name}`,
    body: { settings: options.settings }
  } );
  await esClient.createMapping( options );
};

esClient.createMapping = async ( options = { } ) => {
  if ( environment !== "test" ) { return; }
  await esClient.connection.indices.putMapping( {
    index: `${environment}_${options.name}`,
    body: options.mapping
  } );
};

esClient.connect( );

module.exports = esClient;
