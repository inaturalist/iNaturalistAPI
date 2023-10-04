const { expect } = require( "chai" );
const { execSync } = require( "child_process" );
const inaturalistjs = require( "inaturalistjs" );
const app = require( "../app" );
const testHelper = require( "../lib/test_helper" );
const Taxon = require( "../lib/models/taxon" );
const config = require( "../config" );

function initializeDb() {
  // For tests, we want to make absolutely sure the test database is clean and
  // new, and we need to make sure that happens before we try to connect to it,
  // which happens every time we require pg_client, which happens inside of
  // test_helper, so here we're setting up the database *before* we require
  // anything that would require those modules. Naming this file _initialize.js
  // ensures mocha runs this file first when running tests.
  const dbname = "inaturalist_test";
  const testDbConnectionVar = `${config.database.host ? `PGHOST=${config.database.host}` : ""} \
                              ${config.database.user ? `PGUSER=${config.database.user}` : ""} \
                              ${config.database.password ? `PGPASSWORD=${config.database.password}` : ""}`;

  console.log( "Dropping existing test database" );
  execSync( `${testDbConnectionVar} dropdb --if-exists ${dbname}`, { stdio: [0, 1, 2] } );
  console.log( "Creating test database" );
  execSync( `${testDbConnectionVar} createdb -O ${config.database.user} ${dbname}`, { stdio: [0, 1, 2] } );
  console.log( "Loading test database schema" );
  execSync( `${testDbConnectionVar} psql -q -f schema/database.sql -d ${dbname}`, { stdio: [0, 1, 2] } );
}

exports.mochaGlobalSetup = async function () {
  expect( process.env.NODE_ENV ).to.eq( "test" );

  // Wait for Postgres
  console.log( "Waiting for Postgres..." );
  await testHelper.waitForPG( 100 );

  // Wait for ES
  console.log( "Waiting for ElasticSearch..." );
  await testHelper.waitForES( 100 );

  console.log( "\n\nINITIALIZING TEST ENVIRONMENT\n\n" );

  if ( !process.env.DB_ALREADY_INITIALIZED ) {
    initializeDb( );
  }

  console.log( "Creating ES indices" );
  await testHelper.createIndices( );
  console.log( "Loading ES fixtures" );
  await testHelper.loadElasticsearchFixtures( );
  console.log( "Loading Postgres fixtures" );
  await testHelper.loadPostgresqlFixtures( );
  console.log( "Loading iconic taxa" );
  await Taxon.loadIconicTaxa( );

  console.log( "\n\nDONE INITIALIZING TEST ENVIRONMENT\n\n" );
};

exports.mochaHooks = {
  async beforeAll( ) {
    this.timeout( 20000 );
    this.app = await app( );
  },
  async afterAll( ) {
    this.timeout( 10000 );
    await testHelper.deleteIndices( );
  },
  async beforeEach( ) {
    inaturalistjs.setConfig( {
      apiURL: "http://localhost:3000",
      writeApiURL: "http://localhost:3000"
    } );
  }
};
