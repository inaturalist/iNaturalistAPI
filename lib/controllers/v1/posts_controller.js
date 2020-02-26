const { posts } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const PostsController = class PostsController {
  static async index( req ) {
    return InaturalistAPI.iNatJSWrap( posts.search, req );
  }

  static async for_user( req ) { // eslint-disable-line camelcase
    return InaturalistAPI.iNatJSWrap( posts.for_user, req );
  }

  static create( req ) {
    return InaturalistAPI.iNatJSWrap( posts.create, req );
  }

  static update( req ) {
    return InaturalistAPI.iNatJSWrap( posts.update, req );
  }

  static delete( req ) {
    return InaturalistAPI.iNatJSWrap( posts.delete, req );
  }
};

module.exports = PostsController;
