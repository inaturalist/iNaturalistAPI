var identifications = require( "inaturalistjs" ).identifications,
    testHelper = require( "../../../lib/test_helper" ),
    Identification = require( "../../../lib/models/identification" ),
    IdentificationsController = require( "../../../lib/controllers/v1/identifications_controller" );

describe( "IdentificationsController", function( ) {
  it( "creates", function( done ) {
    testHelper.testInatJSPreload(
      IdentificationsController, identifications, "create", Identification, done );
  });

  it( "updates", function( done ) {
    testHelper.testInatJSPreload(
      IdentificationsController, identifications, "update", Identification, done );
  });

  it( "deletes", function( done ) {
    testHelper.testInatJSNoPreload(
      IdentificationsController, identifications, "delete", done );
  });
});