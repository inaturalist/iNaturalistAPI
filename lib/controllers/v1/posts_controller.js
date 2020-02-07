const { posts } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const PostsController = class PostsController {
  static index( req, callback ) {
    InaturalistAPI.iNatJSWrap( posts.search, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static for_user( req, callback ) { // eslint-disable-line camelcase
    InaturalistAPI.iNatJSWrap( posts.for_user, req )
      .then( r => callback( null, r ) ).catch( callback );
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
