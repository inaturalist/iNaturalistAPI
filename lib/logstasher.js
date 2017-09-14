"use strict";
const _ = require( "lodash" );
const os = require( "os" );

var Logstasher = class Logstasher {

  static logger( ) {
    // log based on port
  }

  static userAgentIsBot( userAgent ) {
    if ( userAgent.match( /(bot|spider|pinger)\//i ) ||
         userAgent.match( /(yahoo|ruby|newrelicpinger|python|lynx|crawler)/i ) ) {
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
    const extra_params = { };
    _.each( payload, ( v, k ) => {
      if ( Logstasher.headersWithIPsObj[k.toLowerCase( )] ) {
        const firstIP = Logstasher.originalIPInList( v );
        if( firstIP && firstIP != v ) {
          extra_params[k] = firstIP;
          extra_params[`${k}-all`] = _.map( v.split(","), ip => ip.trim( ) );
        }
      }
    } );
    return Object.assign( { }, payload, extra_params );
  }

  static clientip( req, payload ) {
    let clientip;
    // try a few params for IP. Proxies will shuffle around requester IP
    _.each( Logstasher.headersWithRequestorIP, h => {
      if ( !payload.clientip && payload[h] ) {
        clientip = payload[h];
      }
    });
    return clientip || req.connection.remoteAddress;
  }

  static languages( payload ) {
    if( !payload["accept-language"] ) { return null; }
    // there may be multiple variations of languages, plus other junk
    return _.map(
      _.filter( payload["accept-language"].split(/[;,]/), l => {
        return l.match( /^[a-z-]+$/i )
      }), l => l.trim( ).toLowerCase( )
    );
  }

  static beforeRequestPayload( req ) {
    let payload = { };
    _.each( req.headers, ( v, k ) => {
      if ( Logstasher.headersToStashObj[k] ) {
        payload[k] = v;
      }
    });
    payload.authorization = !!payload.authorization;
    payload = Logstasher.splitMultipleIPs( payload );
    payload["@timestamp"] = new Date( ).toISOString( );
    payload.method = req.method;
    payload.url = req.url;
    _.each( req.query, ( v, k ) => {
      payload[`query.${k}`] = v;
    } );
    _.each( req.body, ( v, k ) => {
      payload[`body.${k}`] = v;
    } );
    payload.host = os.hostname( );
    payload.ssl = req.secure;
    payload.xhr = req.xhr;
    payload.clientip = Logstasher.clientip( req, payload );
    payload.languages = Logstasher.languages( payload );
    payload.bot = Logstasher.userAgentIsBot( payload["user-agent"] );
    return _.cloneDeep( payload );
  }

  static afterRequestPayload( req, res, duration ) {
    let payload = { };
    payload.status_code = res.statusCode;
    payload.duration = duration;
    _.each( req.params, ( v, k ) => {
      payload[`params.${k}`] = v;
    } );
    payload.route = req.route.path;
    payload.logged_in = !!req.userSession;
    payload.user_session = req.userSession ? req.userSession.user_id : null;
    payload.application_session = !!req.applicationSession;
    return payload;
  }

};

Logstasher.headersToStash = [
  "host", "user-agent", "x-real-ip", "x-forwarded-for", "x-forwarded-proto",
  "x-forwarded-port", "x-cluster-client-ip", "accept-language", "referer",
  "origin", "authorization", "content-length", "content-type", "cache-control"
];

Logstasher.headersWithIPs = [
  "x-real-ip", "x-forwarded-for", "x-cluster-client-ip"
];

Logstasher.headersWithRequestorIP = [
  "x-real-ip", "x-forwarded-for", "x-cluster-client-ip"
];

Logstasher.headersToStashObj = _.zipObject(
  Logstasher.headersToStash,
  Logstasher.headersToStash.map( ( ) => true ) );

Logstasher.headersWithIPsObj = _.zipObject(
  Logstasher.headersWithIPs,
  Logstasher.headersWithIPs.map( ( ) => true ) );

module.exports = Logstasher;
