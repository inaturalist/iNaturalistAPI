const { observation_sounds } = require( "inaturalistjs" ); // eslint-disable-line camelcase
const InaturalistAPI = require( "../../inaturalist_api" );

const ObservationSoundsController = class ObservationSoundsController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( observation_sounds.create, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( observation_sounds.delete, req );
  }

  static async update( req ) {
    return InaturalistAPI.iNatJSWrap( observation_sounds.update, req );
  }
};

module.exports = ObservationSoundsController;
