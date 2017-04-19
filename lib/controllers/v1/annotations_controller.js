"use strict";
var annotations = require( "inaturalistjs" ).annotations,
    InaturalistAPI = require( "../../inaturalist_api" );

var AnnotationsController = class AnnotationsController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( annotations.create, req ).then( r => {
      return callback( null, r );
    }).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( annotations.delete, req  ).then( r => {
      return callback( null, r );
    }).catch( callback );
  }

  static vote( req, callback ) {
    InaturalistAPI.iNatJSWrap( annotations.vote, req  ).then( r => {
      return callback( null, r );
    }).catch( callback );
  }

  static unvote( req, callback ) {
    InaturalistAPI.iNatJSWrap( annotations.unvote, req  ).then( r => {
      return callback( null, r );
    }).catch( callback );
  }
};

module.exports = AnnotationsController;
