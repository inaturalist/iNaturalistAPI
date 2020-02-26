const inaturalistjs = require( "inaturalistjs" );
const Taxon = require( "../lib/models/taxon" );
const testHelper = require( "../lib/test_helper" );
const pgClient = require( "../lib/pg_client" );
const util = require( "../lib/util" );

before( async function ( ) {
  this.timeout( 10000 );
  await testHelper.createIndices( );
  await testHelper.loadElasticsearchFixtures( );
} );

before( async function ( ) {
  this.timeout( 10000 );
  try {
    await pgClient.connect( );
    await testHelper.loadPostgresqlFixtures( );
    await Taxon.loadIconicTaxa( );
  } catch ( e ) {
    console.error( e );
  }
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
