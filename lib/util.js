/* eslint no-console: 0 */
const _ = require( "lodash" );
const moment = require( "moment" );
const config = require( "../config" );
const Logstasher = require( "./logstasher" );

const util = class util {
  static renderError( err, res ) {
    let status = err.status || 500;
    let message = "Error";
    const isFetchError = ( err.response && err.response.status );
    // inatuarlistJS/fetch errors will have HTTP statuses
    // eslint-disable-next-line prefer-destructuring
    if ( isFetchError ) { status = err.response.status; }
    if ( err.custom_message ) {
      message = err.custom_message;
    } else if ( config.debug && err.error ) {
      message = err.error;
    }
    if ( err.message && err.message.match( "Result window is too large" ) ) {
      status = 403;
      message = "Result window is too large, page * per_page must be less than or equal to 10000";
    }
    Logstasher.writeErrorLog( err );
    res.status( status );

    if ( isFetchError ) {
      status = err.response.status; // eslint-disable-line prefer-destructuring
      err.response.text( ).then( text => {
        if ( text ) {
          res.jsonp( { error: { original: JSON.parse( text ) }, status } );
        } else {
          res.jsonp( { error: message, status } );
        }
      } ).catch( ( ) => {
        res.jsonp( { error: message, status } );
      } );
      const debugErr = Object.assign( { }, err );
      delete debugErr.response.body;
      util.debug( debugErr );
      return;
    }
    util.debug( err );
    res.jsonp( { error: message, status } );
  }

  // express middleware which logs request info and duration
  static timingMiddleware( req, res, next ) {
    if ( !Logstasher.logWriteStream( ) ) { return void next( ); }
    if ( req.method === "OPTIONS" ) { return void next( ); }
    const startTime = Date.now( );
    const beforePayload = Logstasher.beforeRequestPayload( req );
    res.on( "finish", ( ) => {
      const duration = Date.now( ) - startTime;
      const afterPayload = Logstasher.afterRequestPayload( req, res, duration );
      const payload = Object.assign( beforePayload, afterPayload );
      Logstasher.logWriteStream( ).write( `${JSON.stringify( payload )}\n` );
    } );
    next( );
  }

  static localeOpts( req ) {
    const localeOpts = { };
    if ( !req.query ) { return localeOpts; }
    if ( req.userSession ) {
      localeOpts.userSession = req.userSession;
      localeOpts.locale = req.userSession.locale;
      localeOpts.preferredPlace = req.userSession.preferredPlace;
      localeOpts.prefersCommonNames = req.userSession.prefersCommonNames;
    }
    if ( req.query.locale ) { localeOpts.locale = req.query.locale.toLowerCase( ); }
    localeOpts.locale = localeOpts.locale || "en";
    if ( req.inat && req.inat.preferredPlace ) {
      localeOpts.preferredPlace = req.inat.preferredPlace;
    }
    if ( req.inat && req.inat.place ) {
      localeOpts.place = req.inat.place;
    }
    return localeOpts;
  }

  static setTTL( req, options ) {
    options = options || { };
    options.allTTL = options.allTTL || 7200;
    options.ttl = options.ttl || 300;
    const p = Object.assign( { }, req.query );
    // locale and verifiable are ignored when checking for empty params
    delete p.locale;
    delete p.verifiable;
    delete p.preferred_place_id;
    req.query.ttl = _.isEmpty( p )
      ? options.allTTL : ( req.query.ttl || options.ttl );
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
    if ( err ) { return void util.renderError( err, res ); }
    if ( req.query.ttl === -1 ) {
      res.setHeader( "Cache-Control",
        "private, no-cache, no-store, must-revalidate" );
      res.setHeader( "Expires", "-1" );
      res.setHeader( "Pragma", "no-cache" );
    } else if ( req.query.ttl && Number( req.query.ttl ) ) {
      res.setHeader( "Cache-Control", `public, max-age=${Number( req.query.ttl )}` );
    }
    res.jsonp( data );
  }

  static debug( data ) {
    if ( config.debug ) {
      if ( _.isObject( data ) ) {
        util.pp( data );
      } else {
        console.log( data );
      }
    }
  }

  static pp( obj ) {
    console.log( JSON.stringify( obj, null, "  " ) );
  }

  static isJa( str ) {
    return str.match( /([ぁ-ゖァ-ヺー一-龯々])/ );
  }

  static capitalize( string ) {
    return string.charAt( 0 ).toUpperCase( )
      + string.substring( 1 ).toLowerCase( );
  }

  static paramArray( param ) {
    if ( !param ) { return param; }
    let p = _.clone( param );
    if ( _.isString( p ) ) {
      p = _.filter( p.split( "," ), _.identity );
    }
    return _.flattenDeep( [p] );
  }

  static dateRangeFilter( timeField, from, to, dateField ) {
    if ( !from && !to ) { return null; }
    let d1 = from ? moment.utc( from ).parseZone( ) : null;
    let d2 = to ? moment.utc( to ).parseZone( ) : null;
    if ( d1 && !d1.isValid( ) ) { d1 = null; }
    if ( d2 && !d2.isValid( ) ) { d2 = null; }
    if ( d1 || d2 ) {
      d1 = d1 || moment.utc( "1800-01-01T00:00:00+00:00" );
      d2 = d2 || moment.utc( ).add( 2, "day" );
      let filter;
      const timeFilter = { };
      timeFilter[timeField] = {
        gte: d1.format( "YYYY-MM-DDTHH:mm:ssZ" ),
        lte: d2.format( "YYYY-MM-DDTHH:mm:ssZ" )
      };
      if ( dateField ) {
        const dateFilter = { };
        dateFilter[dateField] = {
          gte: d1.format( "YYYY-MM-DD" ),
          lte: d2.format( "YYYY-MM-DD" )
        };
        // check if the input parameters are dates without times
        const queryByDate = (
          ( from && d1.format( ).match( /T00:00:00/ ) && !from.match( /00:00:00/ ) )
          || ( to && d2.format( ).match( /T00:00:00/ ) && !to.match( /00:00:00/ ) )
        );
        if ( queryByDate ) {
          filter = { range: dateFilter };
        } else {
          // querying with time, which needs a more complicated query. For
          // observations with times, use them, otherwise just use dates
          filter = {
            bool: {
              should: [
                { bool: { filter: [{ range: timeFilter }, { exists: { field: timeField } }] } },
                {
                  bool: {
                    filter: [{ range: dateFilter }],
                    must_not: [{ exists: { field: timeField } }]
                  }
                }
              ]
            }
          };
        }
      } else {
        filter = { range: timeFilter };
      }
      return filter;
    }
    return null;
  }

  static aggBucketsToHash( buckets, options ) {
    options = options || { };
    const hash = _.fromPairs( _.map( buckets, b => {
      let value = b.doc_count;
      if ( b.facets && b.facets.buckets ) {
        value = _.fromPairs( _.map( b.facets.buckets, fb => [fb.key, fb.doc_count] ) );
      }
      return [b.key_as_string || b.key, value];
    } ) );
    if ( options.backfill ) {
      const min = options.backfill.min || _.min( _.keys( hash ) );
      const max = options.backfill.max || _.max( _.keys( hash ) );
      for ( let i = min; i <= max; i += 1 ) {
        hash[i] = hash[i] || 0;
      }
    }
    return hash;
  }

  static appendNodeENV( ) {
    const configToEnv = {
      apiHost: "API_HOST",
      apiHostSSL: "API_HOST_SSL",
      apiURL: "API_URL",
      writeApiHost: "WRITE_API_HOST",
      writeHostSSL: "WRITE_HOST_SSL",
      writeApiURL: "WRITE_API_URL"
    };
    _.each( configToEnv, ( env, conf ) => {
      if ( config[conf] ) {
        process.env[env] = config[conf];
      }
    } );
  }

  static fixHttps( str ) {
    if ( !str ) { return str; }
    return str
      .replace( /http:\/\/(www|static)\.inaturalist\.org/, "https://$1.inaturalist.org" )
      .replace( /http:\/\/(farm[1-9])\.static/, "https://$1.static" )
      .replace( /http:\/\/upload\.wikimedia/, "https://upload.wikimedia" );
  }

  static preferencesToHash( preferences ) {
    return _.fromPairs( _.map( _.compact( preferences ), p => ( [p.name, p.value] ) ) );
  }

  static locationToLatLng( obj ) {
    if ( obj
      && obj.location
      && obj.location.match( /-?([0-9]*[.])?[0-9]+,-?([0-9]*[.])?[0-9]+/ )
      && !obj.latitude
      && !obj.longitude
    ) {
      const parts = obj.location.split( "," );
      obj.latitude = parts[0];
      obj.longitude = parts[1];
    }
  }

  static objectToQueryString( obj ) {
    return _.reduce( obj, ( components, value, key ) => {
      components.push( `${key}=${( value ? encodeURIComponent( value ) : "" )}` );
      return components;
    }, [] ).join( "&" );
  }
};

util.iucnValues = {
  ne: 0,
  dd: 5,
  lc: 10,
  ny: 20,
  vu: 30,
  en: 40,
  cr: 50,
  ew: 60,
  ex: 70
};

// when util is required, it will modify the node ENV with
// whatever variables from config it feels are needed
util.appendNodeENV( );

module.exports = util;
