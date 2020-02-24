const { photos } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const PhotosController = class PhotosController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( photos.create, req );
  }
};

module.exports = PhotosController;
