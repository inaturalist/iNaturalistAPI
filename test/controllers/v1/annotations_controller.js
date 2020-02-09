const { annotations } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const AnnotationsController = require( "../../../lib/controllers/v1/annotations_controller" );

describe( "AnnotationsController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSNoPreloadAsync( AnnotationsController, annotations, "create", done );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreloadAsync( AnnotationsController, annotations, "delete", done );
  } );

  it( "votes", done => {
    testHelper.testInatJSNoPreloadAsync( AnnotationsController, annotations, "vote", done );
  } );

  it( "unvotes", done => {
    testHelper.testInatJSNoPreloadAsync( AnnotationsController, annotations, "unvote", done );
  } );
} );
