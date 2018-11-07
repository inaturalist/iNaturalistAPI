const { flags } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const FlagsController = class FlagsController {
  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( flags.create, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( flags.delete, req )
      .then( r => callback( null, r ) ).catch( callback );
  }
};

module.exports = FlagsController;
