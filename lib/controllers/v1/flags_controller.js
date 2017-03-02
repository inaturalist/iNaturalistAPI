"use strict";
var flags = require( "inaturalistjs" ).flags,
    InaturalistAPI = require( "../../inaturalist_api" );

var FlagsController = class FlagsController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( flags.create, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( flags.delete, req  ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = FlagsController;
