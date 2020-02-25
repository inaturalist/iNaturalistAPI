const { posts } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const PostsController = require( "../../../lib/controllers/v1/posts_controller" );

describe( "PostsController", ( ) => {
  it( "fetches posts for_user", done => {
    testHelper.testInatJSNoPreload( PostsController, posts, "for_user", done );
  } );

  it( "creates", done => {
    testHelper.testInatJSNoPreload( PostsController, posts, "create", done );
  } );

  it( "updates", done => {
    testHelper.testInatJSNoPreload( PostsController, posts, "update", done );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreload( PostsController, posts, "delete", done );
  } );
} );
