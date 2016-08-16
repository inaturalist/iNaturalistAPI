var posts = require( "inaturalistjs" ).posts,
    testHelper = require( "../../../lib/test_helper" ),
    PostsController = require( "../../../lib/controllers/v1/posts_controller" );

describe( "PostsController", function( ) {
  it( "fetches posts for_user", function( done ) {
    testHelper.testInatJSNoPreload( PostsController, posts, "for_user", done );
  });
});