const { observation_photos } = require( "inaturalistjs" ); // eslint-disable-line camelcase
const InaturalistAPI = require( "../../inaturalist_api" );

const ObservationPhotosController = class ObservationPhotosController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( observation_photos.create, req );
  }

  static async update( req ) {
    return InaturalistAPI.iNatJSWrap( observation_photos.update, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( observation_photos.delete, req );
  }
};

module.exports = ObservationPhotosController;
