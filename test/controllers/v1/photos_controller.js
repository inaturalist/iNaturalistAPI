var photos = require( "inaturalistjs" ).photos,
    testHelper = require( "../../../lib/test_helper" ),
    PhotosController = require( "../../../lib/controllers/v1/photos_controller" );

describe( "PhotosController", function( ) {
  it( "creates", function( done ) {
    testHelper.testInatJSNoPreload( PhotosController, photos, "create", done );
  });
});
