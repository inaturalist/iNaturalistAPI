const { comments } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const Comment = require( "../../../lib/models/comment" );
const CommentsController = require( "../../../lib/controllers/v1/comments_controller" );

describe( "CommentsController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSPreload( CommentsController, comments, "create", Comment, done );
  } );

  it( "updates", done => {
    testHelper.testInatJSPreload( CommentsController, comments, "update", Comment, done );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreload( CommentsController, comments, "delete", done );
  } );
} );
