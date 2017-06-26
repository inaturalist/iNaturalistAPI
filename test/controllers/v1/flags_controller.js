var flags = require( "inaturalistjs" ).flags,
    testHelper = require( "../../../lib/test_helper" ),
    FlagsController = require( "../../../lib/controllers/v1/flags_controller" );

describe( "FlagsController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSNoPreload( FlagsController, flags, "create", done );
  });

  it( "deletes", done => {
    testHelper.testInatJSNoPreload( FlagsController, flags, "delete", done );
  });
});
