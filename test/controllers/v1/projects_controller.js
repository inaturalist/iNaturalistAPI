const { projects } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const ProjectsController = require( "../../../lib/controllers/v1/projects_controller" );
const Project = require( "../../../lib/models/project" );

describe( "ProjectsController", ( ) => {
  it( "joins", done => {
    testHelper.testInatJSNoPreloadAsync(
      ProjectsController, projects, "join", done
    );
  } );

  it( "leaves", done => {
    testHelper.testInatJSNoPreloadAsync(
      ProjectsController, projects, "leave", done
    );
  } );

  it( "adds", done => {
    testHelper.testInatJSNoPreloadAsync(
      ProjectsController, projects, "add", done
    );
  } );

  it( "removes", done => {
    testHelper.testInatJSNoPreloadAsync(
      ProjectsController, projects, "remove", done
    );
  } );

  it( "creates", done => {
    testHelper.testInatJSPreloadAsync(
      ProjectsController, projects, "create", Project, done
    );
  } );

  it( "updates", done => {
    testHelper.testInatJSPreloadAsync(
      ProjectsController, projects, "update", Project, done
    );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreloadAsync(
      ProjectsController, projects, "delete", done
    );
  } );

  it( "features", done => {
    testHelper.testInatJSNoPreloadAsync(
      ProjectsController, projects, "feature", done
    );
  } );

  it( "unfeatures", done => {
    testHelper.testInatJSNoPreloadAsync(
      ProjectsController, projects, "unfeature", done
    );
  } );
} );
