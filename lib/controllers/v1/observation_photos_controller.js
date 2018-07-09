"use strict";
var observation_photos = require( "inaturalistjs" ).observation_photos,
    InaturalistAPI = require( "../../inaturalist_api" );

var ObservationPhotosController = class ObservationPhotosController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( observation_photos.create, req  ).then( r => {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = ObservationPhotosController;
