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
    return { ...payload, ...extraParams };
  }

  static clientip( req, payload ) {
    let clientip;
    // try a few params for IP. Proxies will shuffle around requester IP
    _.each( Logstasher.headersWithRequestorIP, h => {
      if ( !clientip && payload[h] ) {
        clientip = payload[h];
      }
    } );
    if ( clientip ) {
      return clientip;
    }
    if ( req.connection && req.connection.remoteAddress ) {
      return req.connection.remoteAddress;
    }
    return null;
  }

  static ipFromRequest( req ) {
    if ( _.isEmpty( req ) || _.isEmpty( req.headers ) ) {
      return null;
    }
    let payload = { };
    _.each( req.headers, ( v, k ) => {
      if ( Logstasher.headersToStashObj[k] ) {
        payload[k.replace( /-/g, "_" )] = v;
      }
    } );
    payload = Logstasher.splitMultipleIPs( payload );
    return Logstasher.clientip( req, payload );
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
        if ( k === "host" ) {
          k = "http_host";
        }
        payload[k.replace( /-/g, "_" )] = v;
      }
    } );
    payload.authorization_contents = payload.authorization;
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

  static afterRequestPayload( req, res = null, duration = null ) {
    const payload = { };
    if ( res ) {
      payload.status_code = res.statusCode;
    }
    if ( duration ) {
      payload.duration = duration;
    }
    payload.params = req.params;
    payload.route = req.route ? req.route.path : null;
    payload.logged_in = !!req.userSession;
    payload.user_id = req.userSession ? req.userSession.user_id : null;
    payload.application_session = !!req.applicationSession;
    // Parse the body for an attempt to log a client-side error
    if ( req.body && ( req._logClientError || req._logClientMessage ) ) {
      payload.context = req.body.context;
      payload.level = req.body.level;
      // In theory Joi should have already converted this to a Date object
      payload.client_timestamp = req.body.timestamp;
      if ( req._logClientError ) {
        payload.error_type = req.body.error_type;
        payload.error_message = req.body.message;
        payload.backtrace = req.body.backtrace;
        payload.subtype = "ClientError";
      }
      if ( req._logClientMessage ) {
        payload.subtype = "ClientMessage";
        payload.error_message = req.body.message;
      }
    } else if ( req.inat.requestContext ) {
      payload.context = req.inat.requestContext;
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

  static writeAnnouncementImpressionLog( req, announcementID ) {
    if ( !req || !announcementID ) {
      return;
    }
    if ( Logstasher.logWriteStream( ) ) {
      const beforePayload = Logstasher.beforeRequestPayload( req );
      const afterPayload = Logstasher.afterRequestPayload( req );
      const payload = Object.assign( beforePayload, afterPayload );
      payload.subtype = "AnnouncementImpression";
      payload.model_id = announcementID;
      Logstasher.logWriteStream( ).write( `${JSON.stringify( payload )}\n` );
    }
  }
};

// using hyphens here, as express req.headers user hyphens
Logstasher.headersToStash = [
  "host", "user-agent", "x-real-ip", "x-forwarded-for", "x-forwarded-proto",
  "x-forwarded-port", "x-cluster-client-ip", "accept-language", "referer",
  "authorization", "content-length", "content-type", "cache-control",
  "via", "x-via", "x-country-code", "x-installation-id"
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
