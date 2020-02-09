const { flags } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const FlagsController = class FlagsController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( flags.create, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( flags.delete, req );
  }
};

module.exports = FlagsController;
