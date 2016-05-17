var comments = require( "inaturalistjs" ).comments,
    testHelper = require( "../../../lib/test_helper" ),
    Comment = require( "../../../lib/models/comment" ),
    CommentsController = require( "../../../lib/controllers/v1/comments_controller" );

describe( "CommentsController", function( ) {
  it( "creates", function( done ) {
    testHelper.testInatJSPreload( CommentsController, comments, "create", Comment, done );
  });

  it( "updates", function( done ) {
    testHelper.testInatJSPreload( CommentsController, comments, "update", Comment, done );
  });

  it( "deletes", function( done ) {
    testHelper.testInatJSNoPreload( CommentsController, comments, "delete", done );
  });
});