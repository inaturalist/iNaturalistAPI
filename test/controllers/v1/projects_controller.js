const { projects } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const ProjectsController = require( "../../../lib/controllers/v1/projects_controller" );
const Project = require( "../../../lib/models/project" );

describe( "ProjectsController", ( ) => {
  it( "joins", done => {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "join", done
    );
  } );

  it( "leaves", done => {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "leave", done
    );
  } );

  it( "adds", done => {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "add", done
    );
  } );

  it( "removes", done => {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "remove", done
    );
  } );

  it( "creates", done => {
    testHelper.testInatJSPreload(
      ProjectsController, projects, "create", Project, done
    );
  } );

  it( "updates", done => {
    testHelper.testInatJSPreload(
      ProjectsController, projects, "update", Project, done
    );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "delete", done
    );
  } );

  it( "features", done => {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "feature", done
    );
  } );

  it( "unfeatures", done => {
    testHelper.testInatJSNoPreload(
      ProjectsController, projects, "unfeature", done
    );
  } );
} );
