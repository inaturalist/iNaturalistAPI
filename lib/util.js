var _ = require( "underscore" ),
    config = require( "../config" ),
    util = { };

util.renderError = function( err, res ) {
  util.debug( err );
  if( err.message && err.status ) {
    util.renderMessage( res, err.message, err.status );
  } else {
    util.renderMessage( res, "Error", 500 );
  }
};

util.renderMessage = function( res, message, status ) {
  res.set( "Content-Type", "text/html" );
  res.status( status ).send( message ).end( );
};

util.debug = function( data ) {
  if( config.debug ) {
    console.log( data );
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

util.capitalize = function(string) {
  return string.charAt(0).toUpperCase() +
    string.substring(1).toLowerCase();
};

module.exports = util;
