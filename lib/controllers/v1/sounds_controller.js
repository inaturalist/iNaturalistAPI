"use strict";
var sounds = require( "inaturalistjs" ).sounds,
    InaturalistAPI = require( "../../inaturalist_api" );

var SoundsController = class SoundsController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( sounds.create, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = SoundsController;
