const { photos } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const PhotosController = require( "../../../lib/controllers/v1/photos_controller" );

describe( "PhotosController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSNoPreloadAsync( PhotosController, photos, "create", done );
  } );
} );
