var elasticsearch = require( "elasticsearch" ),
    _ = require( "underscore" ),
    config = require( "../config" ),
    util = require( "./util" ),
    esClient = { connection: null },
    host = process.env.ELASTICSEARCH_HOST || config.elasticsearch.host ||
      "127.0.0.1:9200",
    environment = process.env.NODE_ENV || config.environment;

esClient.connect = function( ) {
  if( esClient.connection ) { return esClient.connection; }
  esClient.connection = new elasticsearch.Client({
    host: host,
    log: false // "debug"
  });
  return esClient.connection;
};

esClient.search = function( index, options, callback ) {
  options = options || { };
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: environment + "_" + index,
    body: options.body,
    _source: ( options._source === false ) ?
      false : (options._source || true)
  }, callback );
};

esClient.compileFilters = function( elastic_query ) {
  if( !_.isObject( elastic_query ) || !elastic_query.filters ||
      !_.isArray( elastic_query.filters )) {
    return [ ];
  }
  return _.compact( _.map( elastic_query.filters, function( f ) {
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
    filter.terms[ key ] = v;
  } else {
    // false and 0 values will end up here
    filter.term = { };
    filter.term[ key ] = value;
  }
  return filter;
};

esClient.envelopeFilter = function( filter ) {
  if( !_.isObject( filter ) || !filter.envelope ) { return; };
  var field = _.keys( filter.envelope )[0]
  var opts = filter.envelope[ field ];
    if( !( opts.nelat || opts.nelng || opts.swlat || opts.swlng ) ) { return; }
  opts.swlng = parseFloat(opts.swlng || -180);
  opts.swlat = parseFloat(opts.swlat || -90);
  opts.nelng = parseFloat(opts.nelng || 180);
  opts.nelat = parseFloat(opts.nelat || 90);
  if( opts.nelng && opts.swlng && opts.nelng < opts.swlng ) {
    // the envelope crosses the dateline. Unfortunately, elasticsearch
    // doesn't handle this well and we need to split the envelope at
    // the dateline and do an OR query
    var original_nelng = opts.nelng;
    return { or: [
        esClient.envelopeFilter( _.mapObject( filter, function( val, key ) {
          val[ field ].nelng = 180;
          return val;
        })),
        esClient.envelopeFilter( _.mapObject( filter, function( val, key ) {
          val[ field ].nelng = original_nelng;
          val[ field ].swlng = -180;
          return val;
        }))]};
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
  var filters = esClient.compileFilters( elastic_query );
  var query = _.isEmpty( elastic_query.where ) ?
    { match_all: { } } :
    { bool: { must: elastic_query.where } };
  // when there are filters, the query needs to be wrapped
  // in a filtered block that includes the filters being applied
  if( filters.length > 0 ) {
    query = {
      filtered: {
        query: query,
        filter: {
          bool: { must: filters } } } };
  }
  elastic_query.per_page = (elastic_query.per_page || elastic_query.per_page === 0) ?
    elastic_query.per_page : 30;
  if( elastic_query.per_page > 200 ) { elastic_query.per_page = 200; }
  elastic_query.page = elastic_query.page || 1;
  var elastic_hash = { query: query };
  if( elastic_query.sort ) { elastic_hash.sort = elastic_query.sort; }
  if( elastic_query.fields ) { elastic_hash.fields = elastic_query.fields; }
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
  }, function( err, response ) {
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
  }, function( err, response ) {
    if( err ) { return callback( err ); }
    callback( );
  });
};

esClient.connect( );

module.exports = esClient;
