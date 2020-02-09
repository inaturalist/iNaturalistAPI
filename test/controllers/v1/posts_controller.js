const { posts } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const PostsController = require( "../../../lib/controllers/v1/posts_controller" );

describe( "PostsController", ( ) => {
  it( "fetches posts for_user", done => {
    testHelper.testInatJSNoPreloadAsync( PostsController, posts, "for_user", done );
  } );
} );
