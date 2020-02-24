const { posts } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const PostsController = class PostsController {
  static async index( req ) {
    return InaturalistAPI.iNatJSWrap( posts.search, req );
  }

  static async for_user( req ) { // eslint-disable-line camelcase
    return InaturalistAPI.iNatJSWrap( posts.for_user, req );
  }

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( posts.create, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( posts.update, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( posts.delete, req )
      .then( r => callback( null, r ) ).catch( callback );
  }
};

module.exports = PostsController;
