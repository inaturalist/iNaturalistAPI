var projects = require( "inaturalistjs" ).projects,
    testHelper = require( "../../../lib/test_helper" ),
    ProjectsController = require( "../../../lib/controllers/v1/projects_controller" ),
    Project = require( "../../../lib/models/project" );

describe( "ProjectsController", function( ) {
  it( "joins", function( done ) {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "join", done );
  });

  it( "leaves", function( done ) {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "leave", done );
  });

  it( "adds", function( done ) {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "add", done );
  });

  it( "removes", function( done ) {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "remove", done );
  });

  it( "creates", function( done ) {
    testHelper.testInatJSPreload(
      ProjectsController, projects, "create", Project, done );
  });

  it( "updates", function( done ) {
    testHelper.testInatJSPreload(
      ProjectsController, projects, "update", Project, done );
  });

  it( "deletes", function( done ) {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "delete", done );
  });

});