var observation_photos = require( "inaturalistjs" ).observation_photos,
    testHelper = require( "../../../lib/test_helper" ),
    ObservationPhotosController = require( "../../../lib/controllers/v1/observation_photos_controller" );

describe( "ObservationPhotosController", function( ) {

  it( "creates", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationPhotosController, observation_photos, "create", done );
  });

  it( "updates", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationPhotosController, observation_photos, "update", done );
  });

  it( "deletes", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationPhotosController, observation_photos, "delete", done );
  });

});
