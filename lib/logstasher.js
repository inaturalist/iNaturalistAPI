const _ = require( "lodash" );
const fs = require( "fs" );

let logWriteStream;

const Logstasher = class Logstasher {
  static setLogStreamFilePath( logstreamPath ) {
    // create the log stream globally for this application instance
    logWriteStream = fs.createWriteStream( logstreamPath, { flags: "a" } );
  }

  static logWriteStream( ) {
    return logWriteStream;
  }

  static userAgentIsBot( userAgent ) {
    if ( !userAgent ) { return false; }
    if ( userAgent.match( /(bot|spider|pinger)\//i )
      || userAgent.match( /(yahoo|ruby|newrelicpinger|python|lynx|crawler)/i )
    ) {
      return true;
    }
    return false;
  }

  static originalIPInList( ipstring ) {
    if ( !ipstring || !_.isString( ipstring ) ) { return null; }
    // sometimes IP fields contain multiple IPs delimited by commas
    return _.last( ipstring.split( "," ) ).trim( );
  }

  static splitMultipleIPs( payload ) {
    const extraParams = { };
    _.each( payload, ( v, k ) => {
      if ( Logstasher.headersWithIPsObj[k.toLowerCase( )] ) {
        const firstIP = Logstasher.originalIPInList( v );
        if ( firstIP && firstIP !== v ) {
          extraParams[k] = firstIP;
          extraParams[`${k}_all`] = _.map( v.split( "," ), ip => ip.trim( ) );
        }
      }
    } );
    return Object.assign( { }, payload, extraParams );
  }

  static clientip( req, payload ) {
    let clientip;
    // try a few params for IP. Proxies will shuffle around requester IP
    _.each( Logstasher.headersWithRequestorIP, h => {
      if ( !clientip && payload[h] ) {
        clientip = payload[h];
      }
    } );
    return clientip || req.connection.remoteAddress;
  }

  static languages( payload ) {
    if ( !payload.accept_language ) { return null; }
    // there may be multiple variations of languages, plus other junk
    return _.map( _.filter( payload.accept_language.split( /[;,]/ ),
      l => l.match( /^[a-z-]+$/i ) ), l => l.trim( ).toLowerCase( ) );
  }

  static beforeRequestPayload( req ) {
    let payload = { };
    _.each( req.headers, ( v, k ) => {
      if ( Logstasher.headersToStashObj[k] ) {
        payload[k.replace( /-/g, "_" )] = v;
      }
    } );
    payload.authorization = !!payload.authorization;
    payload = Logstasher.splitMultipleIPs( payload );
    payload["@timestamp"] = new Date( ).toISOString( );
    payload.method = req.method;
    payload.url = req.url;
    const queriesWithValues = _.pickBy( req.query, _.identity );
    payload.query_keys = _.keys( queriesWithValues );
    payload.qry = queriesWithValues;
    payload.body_string = _.isEmpty( req.body ) ? null : JSON.stringify( req.body );
    payload.ssl = !!req.secure;
    payload.xhr = !!req.xhr;
    payload.clientip = Logstasher.clientip( req, payload );
    payload.languages = Logstasher.languages( payload );
    payload.bot = Logstasher.userAgentIsBot( payload.user_agent );
    return _.cloneDeep( payload );
  }

  static afterRequestPayload( req, res, duration ) {
    const payload = { };
    payload.status_code = res.statusCode;
    payload.duration = duration;
    payload.params = req.params;
    payload.route = req.route ? req.route.path : null;
    payload.logged_in = !!req.userSession;
    payload.user_id = req.userSession ? req.userSession.user_id : null;
    payload.application_session = !!req.applicationSession;
    payload.tile_cached = !!( req.elasticmaps && req.elasticmaps.cached );
    if ( payload.route === "/v1/:style/:zoom/:x/:y.:format([a-z.]+)" ) {
      payload.tile_cache_hash = Logstasher.tileCacheParams( req, { string: true } );
      payload.tile_cache_zoom_hash = Logstasher.tileCacheZoomParams( req, { string: true } );
    }
    return payload;
  }

  static errorPayload( err ) {
    const payload = { };
    payload["@timestamp"] = new Date( ).toISOString( );
    payload.subtype = "Exception";
    payload.status = err.status || 500;
    payload.message = "Error";
    const isFetchError = ( err.response && err.response.status );
    // inatuarlistJS/fetch errors will have HTTP statuses
    if ( isFetchError ) { payload.status = err.response.status; }
    if ( err.custom_message ) {
      payload.message = err.custom_message;
    } else if ( err.error ) {
      payload.message = err.error;
    }
    payload.isFetchError = !!isFetchError;
    payload.stack = err.stack;
    return _.cloneDeep( payload );
  }

  static writeErrorLog( err ) {
    if ( Logstasher.logWriteStream( ) ) {
      const errorPayload = Logstasher.errorPayload( err );
      Logstasher.logWriteStream( ).write( `${JSON.stringify( errorPayload )}\n` );
    }
  }

  static tileCacheParams( req, options = { } ) {
    const queryDup = _.pickBy( _.cloneDeep( req.query ), a => ( a !== "any" ) );
    // remove query params that won't affect the data needed to render a tile
    delete queryDup.page;
    delete queryDup.per_page;
    delete queryDup.locale;
    delete queryDup.preferred_place_id;
    delete queryDup.ordered_by;
    delete queryDup.order;
    delete queryDup.return_bounds;
    delete queryDup.callback;
    delete queryDup.color;
    delete queryDup.source;
    delete queryDup.mappable;
    const sortedQuery = _( queryDup ).toPairs( ).sortBy( 0 ).fromPairs( )
      .value( );
    if ( options.string ) {
      return _.map( sortedQuery, ( v, k ) => `${k}:${v}` ).join( ";" );
    }
    return sortedQuery;
  }

  static tileCacheZoomParams( req, options = { } ) {
    const cacheQuery = Logstasher.tileCacheParams( req );
    cacheQuery.zoom = req.params.zoom;
    if ( options.string ) {
      return _.map( cacheQuery, ( v, k ) => `${k}:${v}` ).join( ";" );
    }
    return cacheQuery;
  }
};

// using hyphens here, as express req.headers user hyphens
Logstasher.headersToStash = [
  "host", "user-agent", "x-real-ip", "x-forwarded-for", "x-forwarded-proto",
  "x-forwarded-port", "x-cluster-client-ip", "accept-language", "referer",
  "authorization", "content-length", "content-type", "cache-control"
];

// using underscores for these, as they will be used after converting
// req.header hyphens to underscores
Logstasher.headersWithIPs = [
  "x_real_ip", "x_forwarded_for", "x_cluster_client_ip"
];

Logstasher.headersWithRequestorIP = [
  "x_real_ip", "x_forwarded_for", "x_cluster_client_ip"
];

Logstasher.headersToStashObj = _.zipObject(
  Logstasher.headersToStash,
  Logstasher.headersToStash.map( ( ) => true )
);

Logstasher.headersWithIPsObj = _.zipObject(
  Logstasher.headersWithIPs,
  Logstasher.headersWithIPs.map( ( ) => true )
);

module.exports = Logstasher;
