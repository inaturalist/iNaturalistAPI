var _ = require( "underscore" ),
    moment = require( "moment" ),
    config = require( "../config" ),
    util = { };

util.renderError = function( err, res ) {
  util.debug( err );
  var message = ( config.debug && err.message ) ? err.message : "Error";
  util.renderMessage( res, message, err.status || 500 );
};

util.renderMessage = function( res, message, status ) {
  res.set( "Content-Type", "text/html" );
  res.status( status ).send( message ).end( );
};

// express middleware which logs request info and duration
util.timingMiddleware = function( req, res, next ) {
  if( res.statusCode != "200" ) { return next( ); }
  var startTime = Date.now( );
  res.on( "finish", function( ) {
    var totalTime = Date.now( ) - startTime;
    var logText = "[ "+ new Date( ).toString( ) + "] GET " +
      req.url + " " + totalTime + "ms";
    util.debug( logText );
  });
  next( );
};

// express middleware which sets access control
util.accessControlHeaders = function( req, res, next ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  res.header( "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept" );
  next( );
};

util.debug = function( data ) {
  if( config.debug ) {
    if( _.isObject( data ) ) {
      util.pp( data );
    } else {
      console.log( data );
    }
  }
};

util.pp = function( obj ) {
  console.log( JSON.stringify( obj, null, "  " ) );
};

util.is_ja = function( str ) {
  return str.match( /([ぁ-ゖァ-ヺー一-龯々])/ );
};

util.iconicTaxonIDsByName = {
  animalia: "1",
  amphibia: "20978",
  reptilia: "26036",
  aves: "3",
  mammalia: "40151",
  actinopterygii: "47178",
  mollusca: "47115",
  arachnida: "47119",
  insecta: "47158",
  fungi: "47170",
  plantae: "47126",
  protozoa: "47686",
  chromista: "48222"
};

util.iconicTaxaByID = _.invert( util.iconicTaxonIDsByName );

util.iconicTaxonColors = {
  1: "#1E90FF",
  3: "#1E90FF",
  20978: "#1E90FF",
  26036: "#1E90FF",
  40151: "#1E90FF",
  47115: "#FF4500",
  47119: "#FF4500",
  47126: "#73AC13",
  47158: "#FF4500",
  47170: "#FF1493",
  47178: "#1E90FF",
  47686: "#8B008B",
  48222: "#993300"
};

util.iconicTaxonColorsByName = {
  animalia: "#1E90FF",
  amphibia: "#1E90FF",
  reptilia: "#1E90FF",
  aves: "#1E90FF",
  mammalia: "#1E90FF",
  actinopterygii: "#1E90FF",
  mollusca: "#FF4500",
  arachnida: "#FF4500",
  insecta: "#FF4500",
  fungi: "#FF1493",
  plantae: "#73AC13",
  protozoa: "#691776",
  chromista: "#993300"
};

util.ranks = {
  "root": 100,
  "kingdom": 70,
  "phylum": 60,
  "subphylum": 57,
  "superclass": 53,
  "class": 50,
  "subclass": 47,
  "superorder": 43,
  "order": 40,
  "suborder": 37,
  "infraorder": 35,
  "superfamily": 33,
  "epifamily": 32,
  "family": 30,
  "subfamily": 27,
  "supertribe": 26,
  "tribe": 25,
  "subtribe": 24,
  "genus": 20,
  "genushybrid": 20,
  "species": 10,
  "hybrid": 10,
  "subspecies": 5,
  "variety": 5,
  "form": 5
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
  var d1 = moment.utc( from ).parseZone( );
  var d2 = moment.utc( to ).parseZone( );
  if( d1 && !d1.isValid( ) ) { d1 = null; }
  if( d2 && !d2.isValid( ) ) { d2 = null; }
  if( d1 || d2 ) {
    d1 = d1 || moment.utc( "1800-01-01T00:00:00+00:00" );
    d2 = d2 || moment.utc( ).add( 1, "day");
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
      if( d1.format( ).match( /T00:00:00/ && !from.match( /00:00:00/ ) )) {
        filter = { range: dateFilter };
      } else {
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
