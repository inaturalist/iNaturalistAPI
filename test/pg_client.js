const { expect } = require( "chai" );
const pgClient = require( "../lib/pg_client" );

describe( "pgClient", ( ) => {
  describe( "connect", ( ) => {
    afterEach( ( ) => {
      process.env.NODE_ENV = "test";
    } );

    it( "fails if it can't connect", ( ) => {
      process.env.NODE_ENV = "nonsense";
      pgClient.connection = null;
      pgClient.connect( ( err, connection ) => {
        expect( err ).not.to.be.null;
        expect( connection ).to.be.undefined;
      } );
    } );

    it( "uses the test database", done => {
      pgClient.connect( ( err, connection ) => {
        expect( err, 'Error msg: ' + err.message ).to.be.null;
        expect( connection.database ).to.eq( "inaturalist_test" );
        done( );
      } );
    } );

    it( "returns the open connection", done => {
      pgClient.connect( ( err, connection1 ) => {
        expect( err ).to.be.null;
        expect( connection1.processID ).to.not.be.undefined;
        pgClient.connect( ( errr, connection2 ) => {
          expect( err ).to.be.null;
          expect( connection1.processID ).to.eq( connection2.processID );
          expect( connection1 ).to.eq( connection2 );
          done( );
        } );
      } );
    } );
  } );
} );
