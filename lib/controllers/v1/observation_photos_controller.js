const { observation_photos } = require( "inaturalistjs" ); // eslint-disable-line camelcase
const InaturalistAPI = require( "../../inaturalist_api" );

const ObservationPhotosController = class ObservationPhotosController {
  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( observation_photos.create, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( observation_photos.update, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( observation_photos.delete, req )
      .then( r => callback( null, r ) ).catch( callback );
  }
};

module.exports = ObservationPhotosController;
