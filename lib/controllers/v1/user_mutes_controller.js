const { user_mutes: userMutes } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const UserMutesController = class UserMutesController {
  static async create( req ) {
    console.log( "[DEBUG] UserMutesController create" );
    return InaturalistAPI.iNatJSWrap( userMutes.create, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( userMutes.delete, req );
  }
};

module.exports = UserMutesController;
