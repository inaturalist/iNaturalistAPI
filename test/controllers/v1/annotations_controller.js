const { annotations } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const AnnotationsController = require( "../../../lib/controllers/v1/annotations_controller" );

describe( "AnnotationsController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSNoPreload( AnnotationsController, annotations, "create", done );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreload( AnnotationsController, annotations, "delete", done );
  } );

  it( "votes", done => {
    testHelper.testInatJSNoPreload( AnnotationsController, annotations, "vote", done );
  } );

  it( "unvotes", done => {
    testHelper.testInatJSNoPreload( AnnotationsController, annotations, "unvote", done );
  } );
} );
