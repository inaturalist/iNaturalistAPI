const { photos } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const PhotosController = class PhotosController {
  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( photos.create, req )
      .then( r => callback( null, r ) ).catch( callback );
  }
};

module.exports = PhotosController;
