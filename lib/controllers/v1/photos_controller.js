const { photos } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const Photo = require( "../../models/photo" );

const PhotosController = class PhotosController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( photos.create, req );
  }

  static async update( req ) {
    const response = await InaturalistAPI.iNatJSWrap( photos.update, req );
    const arr = [{ photo: response }];
    await Photo.preloadInto( arr );
    return arr[0].photo;
  }
};

module.exports = PhotosController;
