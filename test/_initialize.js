const { execSync } = require( "child_process" );
const config = require( "../config" );

console.log( "INITIALIZING TEST ENVIRONMENT\n" );

// For tests, we want to make absolutely sure the test database is clean and
// new, and we need to make sure that happens before we try to connect to it,
// which happens every time we require pg_client, which happens inside of
// test_helper, so here we're setting up the database *before* we require
// anything that would require those modules. Naming this file _initialize.js
// ensures mocha runs this file first when running tests.
const testDbConnectionVar = `${config.database.host ? `PGHOST=${config.database.host}` : ""} \
                             ${config.database.user ? `PGUSER=${config.database.user}` : ""} \
                             ${config.database.password ? `PGPASSWORD=${config.database.password}` : ""}`;

console.log( "Dropping existing test database" );
execSync( `${testDbConnectionVar} dropdb --if-exists ${config.database.dbname}`, { stdio: [0, 1, 2] } );
console.log( "Creating test database" );
execSync( `${testDbConnectionVar} createdb -O ${config.database.user} ${config.database.dbname}`, { stdio: [0, 1, 2] } );
console.log( "Loading test database schema" );
execSync( `${testDbConnectionVar} psql -q -f schema/database.sql -d ${config.database.dbname}`, { stdio: [0, 1, 2] } );

/* eslint import/order: 0 */
const testHelper = require( "../lib/test_helper" );
const inaturalistjs = require( "inaturalistjs" );
const Taxon = require( "../lib/models/taxon" );

// Note, these are mocha callbacks called at a global scope, so these run before
// or after *all* tests. Nothing special about initialize.js, it's just another
// test that specifies these before and after callbacks for all tests.

before( async function ( ) {
  this.timeout( 20000 );
  console.log( "Creating ES indices" );
  await testHelper.createIndices( );
  console.log( "Loading ES fixtures" );
  await testHelper.loadElasticsearchFixtures( );
  console.log( "Loading Postgres fixtures" );
  await testHelper.loadPostgresqlFixtures( );
  console.log( "Loading iconic taxa" );
  await Taxon.loadIconicTaxa( );
  console.log( "\nDONE INITIALIZING TEST ENVIRONMENT\n\n" );
} );

after( async function ( ) {
  this.timeout( 10000 );
  await testHelper.deleteIndices( );
} );

beforeEach( ( ) => {
  inaturalistjs.setConfig( {
    apiURL: "http://localhost:4000/v1",
    writeApiURL: "http://localhost:3000"
  } );
} );
