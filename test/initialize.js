var testHelper = require( "../lib/test_helper" );

before( function( done ) {
  this.timeout( 10000 );
  testHelper.createIndices( function( ) {
    testHelper.loadElasticsearchFixtures( done );
  });
});

before( function( done ) {
  this.timeout( 10000 );
  testHelper.loadPostgresqlFixtures( done );
});

after( function( done ) {
  this.timeout( 10000 );
  testHelper.deleteIndices( done );
});

