const { observation_photos } = require( "inaturalistjs" ); // eslint-disable-line camelcase
const testHelper = require( "../../../lib/test_helper" );
const ObservationPhotosController = require(
  "../../../lib/controllers/v1/observation_photos_controller"
);

describe( "ObservationPhotosController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSNoPreloadAsync(
      ObservationPhotosController, observation_photos, "create", done
    );
  } );

  it( "updates", done => {
    testHelper.testInatJSNoPreloadAsync(
      ObservationPhotosController, observation_photos, "update", done
    );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreloadAsync(
      ObservationPhotosController, observation_photos, "delete", done
    );
  } );
} );
