const { flags } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const FlagsController = require( "../../../lib/controllers/v1/flags_controller" );

describe( "FlagsController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSNoPreload( FlagsController, flags, "create", done );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreload( FlagsController, flags, "delete", done );
  } );
} );
