var expect = require( "chai" ).expect,
    pgClient = require( "../lib/pg_client" );

describe( "pgClient", function( ) {
  describe( "connect", function( ) {
    it( "uses the test database", function( ) {
      var connection = pgClient.connect( );
      expect( connection.database ).to.eq( "inaturalist_test" );
    });

    it( "returns the open connection", function( ) {
      var connection = pgClient.connect( );
      expect( connection.processID ).to.not.be.undefined;
      expect( connection ).to.eq( pgClient.connect( ) );
    });
  });
});
