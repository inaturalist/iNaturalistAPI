const { comments } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const Comment = require( "../../../lib/models/comment" );
const CommentsController = require( "../../../lib/controllers/v1/comments_controller" );

describe( "CommentsController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSPreloadAsync( CommentsController, comments, "create", Comment, done );
  } );

  it( "updates", done => {
    testHelper.testInatJSPreloadAsync( CommentsController, comments, "update", Comment, done );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreloadAsync( CommentsController, comments, "delete", done );
  } );
} );
