const inaturalistjs = require( "inaturalistjs" );
const Taxon = require( "../lib/models/taxon" );
const testHelper = require( "../lib/test_helper" );

before( async function ( ) {
  this.timeout( 10000 );
  await testHelper.createIndices( );
  await testHelper.loadElasticsearchFixtures( );
} );

before( async function ( ) {
  this.timeout( 10000 );
  await testHelper.loadPostgresqlFixtures( );
  await Taxon.loadIconicTaxa( );
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
