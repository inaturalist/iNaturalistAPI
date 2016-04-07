"use strict";
var photos = require( "inaturalistjs" ).photos,
    InaturalistAPI = require( "../../inaturalist_api" );

var PhotosController = class PhotosController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( photos.create, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = PhotosController;
