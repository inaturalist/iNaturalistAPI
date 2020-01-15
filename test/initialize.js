const inaturalistjs = require( "inaturalistjs" );
const Taxon = require( "../lib/models/taxon" );
const testHelper = require( "../lib/test_helper" );
const pgClient = require( "../lib/pg_client" );
const util = require( "../lib/util" );

before( function ( done ) {
  this.timeout( 10000 );
  testHelper.createIndices( ( ) => {
    testHelper.loadElasticsearchFixtures( done );
  } );
} );

before( function ( done ) {
  this.timeout( 10000 );
  pgClient.connect( err => {
    if ( err ) { util.debug( err ); }
    testHelper.loadPostgresqlFixtures( ( ) => {
      Taxon.loadIconicTaxa( done );
    } );
  } );
} );

after( function ( done ) {
  this.timeout( 10000 );
  testHelper.deleteIndices( done );
} );

beforeEach( ( ) => {
  inaturalistjs.setConfig( {
    apiURL: "http://localhost:4000/v1",
    writeApiURL: "http://localhost:3000"
  } );
} );
