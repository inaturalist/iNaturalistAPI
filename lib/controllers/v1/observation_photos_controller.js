const { observation_photos: observationPhotos } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const ObservationPhotosController = class ObservationPhotosController {
  static async create( req ) {
    const response = await InaturalistAPI.iNatJSWrap( observationPhotos.create, req );
    // Hack to coerce the Rails version of license_code into the same case as
    // the ES version of license code
    if ( response.photo && typeof ( response.photo.license_code ) === "string" ) {
      response.photo.license_code = response.photo.license_code.toLowerCase( );
    }
    return response;
  }

  static async update( req ) {
    return InaturalistAPI.iNatJSWrap( observationPhotos.update, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( observationPhotos.delete, req );
  }
};

module.exports = ObservationPhotosController;
