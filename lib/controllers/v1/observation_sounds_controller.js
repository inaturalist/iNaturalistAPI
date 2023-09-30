const { observation_sounds: observationSounds } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const ObservationSoundsController = class ObservationSoundsController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( observationSounds.create, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( observationSounds.delete, req );
  }

  static async update( req ) {
    return InaturalistAPI.iNatJSWrap( observationSounds.update, req );
  }
};

module.exports = ObservationSoundsController;
