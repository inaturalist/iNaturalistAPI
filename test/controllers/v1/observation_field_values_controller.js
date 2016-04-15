var observationFieldValues = require( "inaturalistjs" ).observationFieldValues,
    testHelper = require( "../../../lib/test_helper" ),
    ObservationFieldValuesController =
      require( "../../../lib/controllers/v1/observation_field_values_controller" );

describe( "ObservationFieldValuesController", function( ) {
  it( "creates", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationFieldValuesController, observationFieldValues, "create", done );
  });

  it( "updates", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationFieldValuesController, observationFieldValues, "update", done );
  });

  it( "deletes", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationFieldValuesController, observationFieldValues, "delete", done );
  });
});