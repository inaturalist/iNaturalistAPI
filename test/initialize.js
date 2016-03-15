var Taxon = require( "../lib/models/taxon" ),
    testHelper = require( "../lib/test_helper" );

before( function( done ) {
  this.timeout( 10000 );
  testHelper.createIndices( function( ) {
    testHelper.loadElasticsearchFixtures( done );
  });
});

before( function( done ) {
  this.timeout( 10000 );
  testHelper.loadPostgresqlFixtures( function( ) {
    Taxon.loadIconicTaxa( done );
  });
});

after( function( done ) {
  this.timeout( 10000 );
  testHelper.deleteIndices( done );
});
