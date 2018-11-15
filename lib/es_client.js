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
  esClient.connection = new elasticsearch.Client( clientConfig );
  return esClient.connection;
};

esClient.search = ( index, options, callback ) => {
  options = options || { };
  esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${environment}_${index}`,
    body: options.body
  }, callback );
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
        [opts.swlng, opts.swlat],
        [opts.nelng, opts.nelat]
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
  if ( filters.length > 0 || inverseFilters.length > 0 ) {
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
  elasticHash.size = elasticQuery.size || elasticQuery.per_page;
  elasticHash.from = ( elasticQuery.page - 1 ) * elasticQuery.per_page;
  elasticHash.highlight = elasticQuery.highlight;
  return elasticHash;
};

esClient.deleteIndex = ( options, callback ) => {
  if ( environment !== "test" ) { return void callback( ); }
  esClient.connection.indices.exists( { index: `${environment}_${options.name}` },
    ( err, response ) => {
      if ( err ) { return void callback( err ); }
      if ( response === true ) {
        esClient.connection.indices.delete(
          { index: `${environment}_${options.name}` }, callback
        );
      } else {
        callback( );
      }
    } );
};

esClient.createIndexIfNotExists = ( options, callback ) => {
  if ( environment !== "test" ) { return void callback( ); }
  esClient.connection.indices.exists( { index: `${environment}_${options.name}` },
    ( err, response ) => {
      if ( err ) { return void callback( err ); }
      if ( response === false ) {
        esClient.createIndex( options, callback );
      } else {
        callback( );
      }
    } );
};

esClient.createIndex = ( options, callback ) => {
  if ( environment !== "test" ) { return void callback( ); }
  options.settings = options.settings || { };
  esClient.connection.indices.create( {
    index: `${environment}_${options.name}`,
    body: options.settings
  }, err => {
    if ( err ) { return void callback( err ); }
    esClient.createMapping( options, callback );
  } );
};

esClient.createMapping = ( options, callback ) => {
  if ( environment !== "test" ) { return void callback( ); }
  esClient.connection.indices.putMapping( {
    index: `${environment}_${options.name}`,
    type: options.type,
    body: options.mapping
  }, err => {
    if ( err ) { return void callback( err ); }
    callback( );
  } );
};

esClient.connect( );

module.exports = esClient;
