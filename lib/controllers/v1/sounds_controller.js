const { sounds } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const SoundsController = class SoundsController {
  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( sounds.create, req )
      .then( r => callback( null, r ) ).catch( callback );
  }
};

module.exports = SoundsController;
