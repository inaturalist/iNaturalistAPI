const { sounds } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const SoundsController = class SoundsController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( sounds.create, req );
  }
};

module.exports = SoundsController;
