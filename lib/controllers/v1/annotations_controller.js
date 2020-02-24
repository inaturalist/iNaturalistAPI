const { annotations } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const AnnotationsController = class AnnotationsController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( annotations.create, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( annotations.delete, req );
  }

  static async vote( req ) {
    return InaturalistAPI.iNatJSWrap( annotations.vote, req );
  }

  static async unvote( req ) {
    return InaturalistAPI.iNatJSWrap( annotations.unvote, req );
  }
};

module.exports = AnnotationsController;
