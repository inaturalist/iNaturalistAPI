var testHelper = require( "../lib/test_helper" );

before( function( done ) {
  testHelper.createIndices( function( ) {
    testHelper.loadElasticsearchFixtures( done );
  });
});

before( function( done ) {
  testHelper.loadPostgresqlFixtures( done );
});

after( function( done ) {
  testHelper.deleteIndices( done );
});

