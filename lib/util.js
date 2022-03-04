/* eslint no-console: 0 */
const _ = require( "lodash" );
const moment = require( "moment" );
const config = require( "../config" );
const Logstasher = require( "./logstasher" );

const environment = process.env.NODE_ENV || config.environment;

const util = class util {
  static renderError( err, res ) {
    let status = err.status || 500;
    let message = "Error";
    const isFetchError = ( err.response && err.response.status );
    // inatuarlistJS/fetch errors will have HTTP statuses
    // eslint-disable-next-line prefer-destructuring
    if ( isFetchError ) { status = err.response.status; }
    if ( err.message === "401" ) {
      message = "Unauthorized";
      status = 401;
    } else if ( err.message === "422" ) {
      message = "Unprocessable Entity";
      status = 422;
    } else if ( err.message === "404" ) {
      message = "Not Found";
      status = 404;
    } else if ( err.custom_message ) {
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
      if ( environment !== "test" ) {
        util.debug( debugErr );
      }
      return;
    }
    if ( environment !== "test" ) {
      util.debug( err );
    }
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
    if ( !req.query && !req.body ) { return localeOpts; }
    if ( req.userSession ) {
      localeOpts.userSession = req.userSession;
      localeOpts.locale = req.userSession.locale;
      localeOpts.preferredPlace = req.userSession.preferredPlace;
      localeOpts.prefersCommonNames = req.userSession.prefersCommonNames;
    }
    if ( req.query && req.query.locale && _.isString( req.query.locale ) ) {
      localeOpts.locale = req.query.locale.toLowerCase( );
    } else if ( req.body && req.body.locale && _.isString( req.body.locale ) ) {
      localeOpts.locale = req.body.locale.toLowerCase( );
    }
    localeOpts.locale = localeOpts.locale || "en";
    // we use the old-style iw locale for Hebrew, but we want to respond to
    // requests for the newer he locale correctly
    if ( localeOpts.locale.match( /^iw/ ) ) {
      localeOpts.locale = localeOpts.locale.replace( /^iw/, "he" );
    }
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
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Methods, X-Via, X-HTTP-Method-Override" );
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
    if ( config.debug && ( _.isError( data ) || !_.isEmpty( data ) ) ) {
      if ( _.isObject( data ) && !_.isError( data ) ) {
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
    let d1;
    let d2;
    try {
      d1 = from ? moment.utc( from ).parseZone( ) : null;
      d2 = to ? moment.utc( to ).parseZone( ) : null;
    } catch ( e ) {
      return null;
    }
    if ( d1 && !d1.isValid( ) ) { d1 = null; }
    if ( d2 && !d2.isValid( ) ) { d2 = null; }
    if ( d1 || d2 ) {
      const d2Missing = !d2;
      d1 = d1 || moment.utc( "1800-01-01T00:00:00+00:00" );
      d2 = d2 || moment.utc( ).add( 2, "day" );
      let filter;
      const timeFilter = { };
      timeFilter[timeField] = {
        gte: d1.format( "YYYY-MM-DDTHH:mm:ssZ" ),
        lte: d2Missing ? d2.format( "YYYY-MM-DD" ) : d2.format( "YYYY-MM-DDTHH:mm:ssZ" )
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

  static photoAttribution( photo, attributionName, licenseID ) {
    const license = util.licenseInfo[licenseID] || util.licenseInfo[0];
    if ( license.code === "pd" ) {
      return `${attributionName}, no known copyright restrictions (public domain)`;
    }
    if ( license.code === "cc0" ) {
      return "no rights reserved";
    }
    if ( license.code && license.code.match( /^cc-/ ) ) {
      return `(c) ${attributionName}, some rights reserved (${license.short})`;
    }
    return `(c) ${attributionName}, all rights reserved`;
  }

  static parsedDateParam( dateParam ) {
    let parsedDate;
    const dateNumber = Number( dateParam );
    // date is an integer
    if ( dateNumber && dateNumber.toString( ) === dateParam.toString( ) ) {
      const currentUnixSeconds = new Date( ).getTime( ) / 1000;
      // Make sure the integer is in a reasonable range for unix seconds (10000000 is around 1970)
      if ( dateNumber > 10000000 && dateNumber < currentUnixSeconds ) {
        parsedDate = moment.utc( new Date( dateNumber * 1000 ) );
      }
    }
    if ( !parsedDate ) {
      parsedDate = moment.utc( new Date( dateParam ) );
    }
    return ( parsedDate && parsedDate.isValid( ) ) ? parsedDate : null;
  }

  static dateParamMonthRange( dateParam ) {
    const parsedDate = this.parsedDateParam( dateParam );
    if ( parsedDate && parsedDate.isValid( ) ) {
      // 0 is January
      const dateMonth = parsedDate.month( );
      const monthBefore = ( dateMonth - 1 ) % 12;
      const monthAfter = ( dateMonth + 1 ) % 12;
      return [monthBefore + 1, dateMonth + 1, monthAfter + 1];
    }
    return null;
  }

  static observationSearchRequestCacheKey( req, prefix, options = { } ) {
    let fileCacheKey;
    if ( environment === "test" ) { return null; }
    const queryDup = _.pickBy( _.cloneDeep( req.query ), a => ( a !== "any" ) );
    const reqInatDup = _.pickBy( _.cloneDeep( req.inat ), a => ( a !== "any" ) );

    if ( prefix === "ObservationsController.identifiers"
      || prefix === "ObservationsController.observers"
    ) {
      if ( queryDup.order_by === "observations.id" ) {
        delete queryDup.order_by;
        if ( queryDup.order === "desc" ) {
          delete queryDup.order;
        }
      }
    }
    // remove query params that won't affect the un-localized result,
    // and remove all the params we are using in the cache key
    if ( prefix === "ESModel.ancestriesSpeciesCounts" || queryDup.page === "1" ) {
      delete queryDup.page;
    }
    if ( prefix === "ObservationsController.identifiers"
      || prefix === "ObservationsController.observers"
      || prefix === "ESModel.ancestriesSpeciesCounts"
    ) {
      delete queryDup.order;
    }
    if ( prefix === "ObservationsController.identifiers"
      || prefix === "ObservationsController.observers"
      || prefix === "ObservationsController.speciesCounts"
      || prefix === "ESModel.ancestriesSpeciesCounts"
    ) {
      delete queryDup.return_bounds;
    }
    if ( prefix === "ObservationsController.identifiers"
      || prefix === "ObservationsController.observers"
      || prefix === "ESModel.ancestriesSpeciesCounts"
    ) {
      delete queryDup.locale;
      delete queryDup.preferred_place_id;
    }
    const cacheableParams = { };
    cacheableParams.placeID = queryDup.place_id ? queryDup.place_id : null;
    cacheableParams.verifiable = queryDup.verifiable ? queryDup.verifiable : null;
    cacheableParams.qualityGrade = queryDup.quality_grade ? queryDup.quality_grade : null;
    cacheableParams.spam = queryDup.spam ? queryDup.spam : null;
    cacheableParams.captive = queryDup.captive ? queryDup.captive : null;
    cacheableParams.perPage = queryDup.per_page ? queryDup.per_page : null;
    cacheableParams.order = queryDup.order ? queryDup.order : null;
    cacheableParams.orderBy = queryDup.order_by ? queryDup.order_by : null;
    cacheableParams.returnBounds = queryDup.return_bounds ? queryDup.return_bounds : null;
    cacheableParams.locale = queryDup.locale ? queryDup.locale : null;
    cacheableParams.preferredPlaceID = queryDup.preferred_place_id
      ? queryDup.preferred_place_id : null;
    cacheableParams.photos = queryDup.photos ? queryDup.photos : null;
    if ( prefix === "ObservationsController.identifiers"
      || prefix === "ObservationsController.speciesCounts"
      || prefix === "ObservationsController.observers"
      || prefix === "ObservationsController.histogram"
      || prefix === "ESModel.ancestriesSpeciesCounts"
    ) {
      cacheableParams.taxonID = queryDup.taxon_id ? queryDup.taxon_id : null;
      delete queryDup.taxon_id;
      delete reqInatDup.taxon;
    }
    if ( prefix === "ObservationsController.histogram"
    ) {
      cacheableParams.dateField = queryDup.date_field ? queryDup.date_field : null;
      delete queryDup.date_field;
      cacheableParams.interval = queryDup.interval ? queryDup.interval : null;
      delete queryDup.interval;
    }
    delete queryDup.per_page;
    delete queryDup.ttl;
    delete queryDup.verifiable;
    delete queryDup.ordered_by;
    delete queryDup.view;
    delete queryDup.quality_grade;
    delete queryDup.place_id;
    delete queryDup.spam;
    delete queryDup.captive;
    delete queryDup.order;
    delete queryDup.order_by;
    delete queryDup.return_bounds;
    delete queryDup.locale;
    delete queryDup.preferred_place_id;
    delete queryDup.photos;
    delete reqInatDup.preferredPlace;
    delete reqInatDup.place;
    if ( _.isEmpty( queryDup.taxon_id ) ) {
      delete queryDup.taxon_id;
    }
    if ( queryDup.order_by === "" ) {
      delete queryDup.order_by;
    }
    if ( _.isEmpty( queryDup.lat ) && _.isEmpty( queryDup.lat ) ) {
      delete queryDup.lat;
      delete queryDup.lng;
      delete queryDup.radius;
    }
    // only cacheable params are present, so generate a cache key
    if ( _.isEmpty( queryDup ) && _.isEmpty( reqInatDup ) ) {
      fileCacheKey = `${prefix}`;
      _.each( cacheableParams, ( v, k ) => {
        if ( v && !( k === "perPage" && options.ignorePagination ) ) {
          fileCacheKey += `-${k}-${v}`;
        }
      } );
    }
    return fileCacheKey;
  }

  static isRapidAPIRequest( req ) {
    if ( !config.rapidAPI || !config.rapidAPI.proxySecret ) {
      throw new Error( 500 );
    }
    if ( req.headers["x-rapidapi-proxy-secret"] !== config.rapidAPI.proxySecret ) {
      return false;
    }
    return true;
  }

  // Utility to look up IDs from UUIDs to forward requests to the v1 API
  static async uuidsToSerialIds( req, model ) {
    // eslint-disable-next-line global-require
    const ESModel = require( "./models/es_model" );
    const uuids = _.isString( req.params.uuid )
      ? [req.params.uuid]
      : req.params.uuid.slice( 0, 200 );
    const recordsByUuid = await ESModel.findByUuids( uuids, model );
    req.params = Object.assign( req.params, {
      id: _.map( recordsByUuid, v => v.id )
    } );
    delete req.params.uuid;
  }

  static httpError( status, message ) {
    const e = new Error( status );
    e.custom_message = message;
    e.status = status;
    return e;
  }

  static isUUID( uuid ) {
    return uuid.toString( )
      .match( /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/ );
  }

  static stringifyValues( obj ) {
    return _.transform( obj, ( result, value, key ) => {
      if ( _.isArray( value ) ) {
        result[key] = _.map( value, v => {
          switch ( typeof ( v ) ) {
            case "object":
              return util.stringifyValues( v );
            default:
              return v.toString( );
          }
        } );
      } else if ( _.isNull( value ) ) {
        result[key] = null;
      } else if ( typeof ( value ) === "object" ) {
        result[key] = util.stringifyValues( value );
      } else {
        result[key] = value.toString( );
      }
    },
    _.isArray( obj ) ? [] : {} );
  }

  static filtersOnlyOnID( filters ) {
    // filters looks like [{ terms: { id: [1] } }]
    if ( filters
      && _.size( filters ) === 1
      && _.isPlainObject( filters[0] )
      && _.size( filters[0] ) === 1
      && filters[0].terms
      && _.isPlainObject( filters[0].terms )
      && _.size( filters[0].terms ) === 1
      && filters[0].terms.id
      && _.isArray( filters[0].terms.id )
      && _.size( filters[0].terms.id ) > 0
    ) {
      return filters[0].terms.id;
    }
    return false;
  }

  static filtersOnlyOnUserID( filters ) {
    // inverseFilters looks like [{ terms: { "user.id": [1] } }]
    if ( filters && _.size( filters ) === 1
      && _.isPlainObject( filters[0] )
      && _.size( filters[0] ) === 1
      && filters[0].terms
      && _.isPlainObject( filters[0].terms )
      && _.size( filters[0].terms ) === 1
      && filters[0].terms["user.id"]
      && _.isArray( filters[0].terms["user.id"] )
      && _.size( filters[0].terms["user.id"] ) > 0
    ) {
      return filters[0].terms["user.id"];
    }
    return false;
  }

  static sourceParams( source ) {
    if ( _.isEmpty( source ) ) {
      return { };
    }
    if ( _.isArray( source ) ) {
      return { _source: source };
    }
    const sourceHash = { };
    if ( source.includes ) {
      sourceHash._source_includes = source.includes.join( "," );
    }
    if ( source.excludes ) {
      sourceHash._source_excludes = source.excludes.join( "," );
    }
    return sourceHash;
  }

  // takes an array and sends each item to a supplied asynchronous function in sequence,
  // waiting for the previous function to finish before moving to the next item
  static async forEachInSequence( items, asyncFunction ) {
    await items.reduce( async ( promise, item ) => {
      await promise;
      await asyncFunction( item );
    }, Promise.resolve( ) );
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

util.licenseInfo = {
  0: { code: "c", short: "(c)" },
  1: { code: "cc-by-nc-sa", short: "CC BY-NC-SA" },
  2: { code: "cc-by-nc", short: "CC BY-NC" },
  3: { code: "cc-by-nc-nd", short: "CC BY-NC-ND" },
  4: { code: "cc-by", short: "CC BY" },
  5: { code: "cc-by-sa", short: "CC BY-SA" },
  6: { code: "cc-by-nd", short: "CC BY-ND" },
  7: { code: "pd", short: "PD" },
  8: { code: "gfdl", short: "GFDL" },
  9: { code: "cc0", short: "CC0" }
};

// when util is required, it will modify the node ENV with
// whatever variables from config it feels are needed
util.appendNodeENV( );

module.exports = util;
