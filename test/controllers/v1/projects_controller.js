var projects = require( "inaturalistjs" ).projects,
    testHelper = require( "../../../lib/test_helper" ),
    ProjectsController = require( "../../../lib/controllers/v1/projects_controller" );

describe( "ProjectsController", function( ) {
  it( "joins", function( done ) {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "join", done );
  });

  it( "leaves", function( done ) {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "leave", done );
  });
});