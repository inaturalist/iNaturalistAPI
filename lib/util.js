/* eslint no-console: 0 */
"use strict";
var _ = require( "underscore" ),
    moment = require( "moment" ),
    config = require( "../config" )

var util = class util {
  static renderError( err, res ) {
    var status = err.status || 500;
    if( err.response && err.response.status ) {
      status = err.response.status;
      var debugErr = Object.assign( { }, err );
      delete debugErr.response.body;
      util.debug( debugErr );
    } else {
      util.debug( err );
    }
    var message = "Error";
    if( err.message ) {
      message = err.message
    } else if ( config.debug && err.error ) {
      message = err.error;
    }
    res.status( status );
    res.jsonp({ error: message, status: status });
  }

  // express middleware which logs request info and duration
  static timingMiddleware( req, res, next ) {
    if( res.statusCode != "200" ) { return next( ); }
    var startTime = Date.now( );
    res.on( "finish", function( ) {
      var totalTime = Date.now( ) - startTime;
      var logText = "[ "+ new Date( ).toString( ) + "] GET " +
        req.url + " " + totalTime + "ms";
      util.debug( logText );
    });
    next( );
  }

  static localeOpts( req ) {
    var localeOpts = { };
    if( !req.query ) { return localeOpts; }
    if( req.query.locale ) { localeOpts.locale = req.query.locale; }
    localeOpts.locale = localeOpts.locale || "en";
    if( req.inat && req.inat.preferredPlace ) {
      localeOpts.preferredPlace = req.inat.preferredPlace;
    }
    if( req.inat && req.inat.place ) {
      localeOpts.place = req.inat.place;
    }
    return localeOpts;
  }

  static setTTL( req, options ) {
    options = options || { };
    options.allTTL = options.allTTL || 7200;
    options.ttl = options.ttl || 300;
    var p = Object.assign( { }, req.query );
    // locale and verifiable are ignored when checking for empty params
    delete p.locale;
    delete p.verifiable;
    delete p.preferred_place_id;
    req.query.ttl = _.isEmpty( p ) ?
      options.allTTL : ( req.query.ttl || options.ttl );
  }

  // express middleware which sets access control
  static accessControlHeaders( req, res, next ) {
    res.header( "Access-Control-Allow-Origin", "*" );
    res.header( "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Methods" );
    res.header( "Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE" );
    next( );
  }

  static renderJSONPresponse( req, res, err, data ) {
    if( err ) { return util.renderError( err, res ); }
    if( req.query.ttl == -1 ) {
      res.setHeader( "Cache-Control",
        "private, no-cache, no-store, must-revalidate" );
      res.setHeader( "Expires", "-1" );
      res.setHeader( "Pragma", "no-cache" );
    } else if( req.query.ttl && Number( req.query.ttl ) ) {
      res.setHeader( "Cache-Control",
        "public, max-age=" + Number( req.query.ttl ));
    }
    res.jsonp( data );
  }

  static debug( data ) {
    if( config.debug ) {
      if( _.isObject( data ) ) {
        util.pp( data );
      } else {
        console.log( data );
      }
    }
  }

  static pp( obj ) {
    console.log( JSON.stringify( obj, null, "  " ) );
  }

  static is_ja( str ) {
    return str.match( /([ぁ-ゖァ-ヺー一-龯々])/ );
  }

  static capitalize( string ) {
    return string.charAt( 0 ).toUpperCase( ) +
      string.substring( 1 ).toLowerCase( );
  }

  static paramArray( param ) {
    if( !param ) { return param; }
    var p = _.clone( param );
    if( _.isString( p ) ) {
      p = _.filter( p.split(","), _.identity );
    }
    return _.flatten([ p ]);
  }

  static dateRangeFilter( timeField, from, to, dateField ) {
    if( !from && !to ) { return; }
    var d1 = from ? moment.utc( from ).parseZone( ) : null;
    var d2 = to ? moment.utc( to ).parseZone( ) : null;
    if( d1 && !d1.isValid( ) ) { d1 = null; }
    if( d2 && !d2.isValid( ) ) { d2 = null; }
    if( d1 || d2 ) {
      d1 = d1 || moment.utc( "1800-01-01T00:00:00+00:00" );
      d2 = d2 || moment.utc( ).add( 2, "day");
      var filter;
      var timeFilter = { };
      timeFilter[ timeField ] = {
        gte: d1.format( ),
        lte: d2.format( ) };
      if( dateField ) {
        var dateFilter = { };
        dateFilter[ dateField ] = {
          gte: d1.format( "YYYY-MM-DD" ),
          lte: d2.format( "YYYY-MM-DD" ) }
        // check if the input parameters are dates without times
        var queryByDate = (
            ( from && d1.format( ).match( /T00:00:00/ ) && !from.match( /00:00:00/ )) ||
            ( to && d2.format( ).match( /T00:00:00/ ) && !to.match( /00:00:00/ )));
        if( queryByDate ) {
          filter = { range: dateFilter };
        } else {
          // querying with time, which needs a more complicated query. For
          // observations with times, use them, otherwise just use dates
          filter = { or: [
            { and: [ { range: timeFilter }, { exists: { field: timeField } } ] },
            { and: [ { range: dateFilter }, { missing: { field: timeField } } ] }
          ]};
        }
      } else {
        filter = { range: timeFilter };
      }
      return filter;
    }
  }

  static appendNodeENV( ) {
    if( config.writeApiHost ) {
      process.env.WRITE_API_HOST = config.writeApiHost;
    }
  }
};

util.iucnValues = {
  "ne": 0,
  "dd": 5,
  "lc": 10,
  "ny": 20,
  "vu": 30,
  "en": 40,
  "cr": 50,
  "ew": 60,
  "ex": 70
};

// when util is required, it will modify the node ENV with
// whatever variables from config it feels are needed
util.appendNodeENV( );

util.capitalize = function( string ) {
  return string.charAt( 0 ).toUpperCase( ) +
    string.substring( 1 ).toLowerCase( );
};

util.paramArray = function( param ) {
  if( !param ) { return param; }
  var p = _.clone( param );
  if( _.isString( p ) ) {
    p = _.filter( p.split(","), _.identity );
  }
  return _.flatten([ p ]);
};

util.dateRangeFilter = function( timeField, from, to, dateField ) {
  if( !from && !to ) { return; }
  var d1 = from ? moment.utc( from ).parseZone( ) : null;
  var d2 = to ? moment.utc( to ).parseZone( ) : null;
  if( d1 && !d1.isValid( ) ) { d1 = null; }
  if( d2 && !d2.isValid( ) ) { d2 = null; }
  if( d1 || d2 ) {
    d1 = d1 || moment.utc( "1800-01-01T00:00:00+00:00" );
    d2 = d2 || moment.utc( ).add( 2, "day");
    var filter;
    var timeFilter = { };
    timeFilter[ timeField ] = {
      gte: d1.format( "YYYY-MM-DDTHH:mm:ssZ" ),
      lte: d2.format( "YYYY-MM-DDTHH:mm:ssZ" ) };
    if( dateField ) {
      var dateFilter = { };
      dateFilter[ dateField ] = {
        gte: d1.format( "YYYY-MM-DD" ),
        lte: d2.format( "YYYY-MM-DD" ) }
      // check if the input parameters are dates without times
      var queryByDate = (
          ( from && d1.format( ).match( /T00:00:00/ ) && !from.match( /00:00:00/ )) ||
          ( to && d2.format( ).match( /T00:00:00/ ) && !to.match( /00:00:00/ )));
      if( queryByDate ) {
        filter = { range: dateFilter };
      } else {
        // querying with time, which needs a more complicated query. For
        // observations with times, use them, otherwise just use dates
        filter = { or: [
          { and: [ { range: timeFilter }, { exists: { field: timeField } } ] },
          { and: [ { range: dateFilter }, { missing: { field: timeField } } ] }
        ]};
      }
    } else {
      filter = { range: timeFilter };
    }
    return filter;
  }
};

module.exports = util;
