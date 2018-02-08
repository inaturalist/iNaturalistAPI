var elasticsearch = require( "elasticsearch" ),
    _ = require( "underscore" ),
    config = require( "../config" ),
    util = require( "./util" ),
    esClient = { connection: null },
    host = process.env.ELASTICSEARCH_HOST || config.elasticsearch.host ||
      "127.0.0.1:9200",
    hosts = process.env.ELASTICSEARCH_HOSTS || config.elasticsearch.hosts,
    environment = process.env.NODE_ENV || config.environment;

esClient.connect = function( ) {
  if( esClient.connection ) { return esClient.connection }
  var clientConfig = { log: false };
  if( hosts ) {
    clientConfig.hosts = _.isArray( hosts ) ? hosts : hosts.split(" ");
  } else {
    clientConfig.host = host;
  }
  clientConfig.suggestCompression = true;
  esClient.connection = new elasticsearch.Client( clientConfig );
  return esClient.connection;
};

esClient.search = function( index, options, callback ) {
  options = options || { };
  esClient.connection.search({
    preference: global.config.elasticsearch.preference,
    index: environment + "_" + index,
    body: options.body
  }, callback );
};

esClient.compileFilters = function( filters ) {
  if( !filters || !_.isArray( filters )) {
    return [ ];
  }
  return _.compact( _.map( filters, function( f ) {
    if( !_.isObject( f ) || _.size( f ) !== 1 ) { return; }
    if( f.envelope ) {
      return esClient.envelopeFilter( f );
    }
    return f;
  }));
};

esClient.termFilter = function( key, value ) {
  var filter = { };
  var v = util.paramArray( value );
  if( _.isArray( v ) ) {
    filter.terms = { };
    filter.terms[ key ] = v.sort( );
  } else {
    // false and 0 values will end up here
    filter.term = { };
    filter.term[ key ] = value;
  }
  return filter;
};

esClient.envelopeFilter = function( filter ) {
  if( !_.isObject( filter ) || !filter.envelope ) { return; }
  var field = _.keys( filter.envelope )[0]
  var opts = filter.envelope[ field ];
    if( !( opts.nelat || opts.nelng || opts.swlat || opts.swlng ) ) { return; }
  opts.swlng = parseFloat(opts.swlng || -180);
  opts.swlat = parseFloat(opts.swlat || -90);
  opts.nelng = parseFloat(opts.nelng || 180);
  opts.nelat = parseFloat(opts.nelat || 90);
  if ( opts.swlng < -180 ) { opts.swlng = -180; }
  if ( opts.swlng > 180 ) { opts.swlng = 180; }
  if ( opts.swlat < -90 ) { opts.swlat = -90; }
  if ( opts.swlat > 90 ) { opts.swlat = 90; }
  if ( opts.nelng < -180 ) { opts.nelng = -180; }
  if ( opts.nelng > 180 ) { opts.nelng = 180; }
  if ( opts.nelat < -90 ) { opts.nelat = -90; }
  if ( opts.nelat > 90 ) { opts.nelat = 90; }
  if( opts.nelng && opts.swlng && opts.nelng < opts.swlng ) {
    // the envelope crosses the dateline. Unfortunately, elasticsearch
    // doesn't handle this well and we need to split the envelope at
    // the dateline and do an OR query
    var original_nelng = opts.nelng;
    return { bool: { should: [
        esClient.envelopeFilter( _.mapObject( filter, function( val ) {
          val[ field ].nelng = 180;
          return val;
        })),
        esClient.envelopeFilter( _.mapObject( filter, function( val ) {
          val[ field ].nelng = original_nelng;
          val[ field ].swlng = -180;
          return val;
        }))]}};
  }
  var envelope = { geo_shape: { } };
  envelope.geo_shape[ field ] = {
    shape: {
      type: "envelope",
      coordinates: [
        [ opts.swlng, opts.swlat ],
        [ opts.nelng, opts.nelat ]
      ]
    }
  };
  return envelope;
};

esClient.searchHash = function( elastic_query ) {
  var filters = esClient.compileFilters( elastic_query.filters );
  var inverse_filters = esClient.compileFilters( elastic_query.inverse_filters );
  var grouped_inverse_filters = esClient.compileFilters( elastic_query.grouped_inverse_filters );
  var query = { };
  if( filters.length > 0 || inverse_filters.length > 0 ) {
    query = { bool: { } };
  }
  if( filters.length > 0 ) {
    query.bool.filter = filters;
  }

  // Inverse filters select results that fail to pass the filters individually,
  // so !(A || B || C), which is the same as (!A && !B && !C)
  if( inverse_filters.length > 0 ) {
    query.bool.must_not = inverse_filters;
  }
  // Grouped inverse filters select results that fail to pass the filters as a
  // group, so !(A && B && C), which is the same as (!A || !B || !C) This is for
  // situations like looking for observations in a project that don't pass the
  // project rules. If an observation fails any of the rules, it should be
  // included
  if ( grouped_inverse_filters.length > 0 ) {
    query.bool.must_not = query.bool.must_not || [];
    query.bool.must_not.push( {
      bool: {
        filter: grouped_inverse_filters
      }
    } );
  }
  if( !query.bool ) {
    query = { match_all: { } };
  }
  elastic_query.per_page = (elastic_query.per_page || elastic_query.per_page === 0) ?
    elastic_query.per_page : 30;
  // prevent very large per_page values
  if( elastic_query.per_page > 10000 ) { elastic_query.per_page = 30; }
  elastic_query.page = elastic_query.page || 1;
  var elastic_hash = { };
  if ( elastic_query.sort ) {
    if ( elastic_query.sort === "random" ) {
      query = {
        function_score: {
          query: query,
          random_score: { }
        }
      }
    } else {
      elastic_hash.sort = elastic_query.sort;
    }
  }
  elastic_hash.query = query;
  if( elastic_query.aggs ) { elastic_hash.aggs = elastic_query.aggs; }
  elastic_hash.size = elastic_query.size || elastic_query.per_page;
  elastic_hash.from = ( elastic_query.page - 1 ) * elastic_query.per_page;
  elastic_hash.highlight = elastic_query.highlight;
  return elastic_hash;
};

esClient.deleteIndex = function( options, callback ) {
  if( environment !== "test" ) { return callback( ); }
  esClient.connection.indices.exists({ index: environment + "_" + options.name },
    function( err, response ) {
      if( err ) { return callback( err ); }
      if( response === true ) {
        esClient.connection.indices.delete(
          { index: environment + "_" + options.name }, callback );
      } else {
        callback( );
      }
    }
  );
};

esClient.createIndexIfNotExists = function( options, callback ) {
  if( environment !== "test" ) { return callback( ); }
  esClient.connection.indices.exists({ index: environment + "_" + options.name },
    function( err, response ) {
      if( err ) { return callback( err ); }
      if( response === false ) {
        esClient.createIndex( options, callback );
      } else {
        callback( );
      }
    }
  );
};

esClient.createIndex = function( options, callback ) {
  if( environment !== "test" ) { return callback( ); }
  options.settings = options.settings || { };
  esClient.connection.indices.create({
    index: environment + "_" + options.name,
    body: options.settings
  }, function( err ) {
    if( err ) { return callback( err ); }
    esClient.createMapping( options, callback );
  });
};

esClient.createMapping = function( options, callback ) {
  if( environment !== "test" ) { return callback( ); }
  esClient.connection.indices.putMapping({
    index: environment + "_" + options.name,
    type: options.type,
    body: options.mapping
  }, function( err ) {
    if( err ) { return callback( err ); }
    callback( );
  });
};

esClient.connect( );

module.exports = esClient;
