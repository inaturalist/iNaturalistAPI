const { observation_field_values } = require( "inaturalistjs" ); // eslint-disable-line camelcase
const testHelper = require( "../../../lib/test_helper" );
const ObservationFieldValuesController = require(
  "../../../lib/controllers/v1/observation_field_values_controller"
);

describe( "ObservationFieldValuesController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSNoPreload(
      ObservationFieldValuesController, observation_field_values, "create", done
    );
  } );

  it( "updates", done => {
    testHelper.testInatJSNoPreload(
      ObservationFieldValuesController, observation_field_values, "update", done
    );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreload(
      ObservationFieldValuesController, observation_field_values, "delete", done
    );
  } );
} );
