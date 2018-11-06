const { sounds } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const SoundsController = require( "../../../lib/controllers/v1/sounds_controller" );

describe( "SoundsController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSNoPreload( SoundsController, sounds, "create", done );
  } );
} );
