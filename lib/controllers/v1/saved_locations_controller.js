const { saved_locations: savedLocations } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const SavedLocationsController = class SavedLocationsController {
  static async search( req ) {
    return InaturalistAPI.iNatJSWrap( savedLocations.search, req );
  }

  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( savedLocations.create, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( savedLocations.delete, req );
  }
};

module.exports = SavedLocationsController;
