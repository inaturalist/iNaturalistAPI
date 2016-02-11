var expect = require( "chai" ).expect,
    pgClient = require( "../lib/pg_client" );

describe( "pgClient", function( ) {
  describe( "connect", function( ) {
    afterEach( function( ) {
      process.env.NODE_ENV = "test";
    });

    it( "fails if it can't connect", function( ) {
      process.env.NODE_ENV = "nonsense";
      pgClient.connection = null;
      var connection = pgClient.connect( function( err, connection ) {
        expect( err ).not.to.be.null;
        expect( connection ).to.be.undefined;
      });
    });

    it( "uses the test database", function( done ) {
      pgClient.connect( function( err, connection ) {
        expect( err ).to.be.null;
        expect( connection.database ).to.eq( "inaturalist_test" );
        done( );
      });
    });

    it( "returns the open connection", function( done ) {
      pgClient.connect( function( err, connection1 ) {
        expect( err ).to.be.null;
        expect( connection1.processID ).to.not.be.undefined;
        pgClient.connect( function( err, connection2 ) {
          expect( err ).to.be.null;
          expect( connection1.processID ).to.eq( connection2.processID );
          expect( connection1 ).to.eq( connection2 );
          done( );
        });
      });
    });
  });
});
