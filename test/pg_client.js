const { expect } = require( "chai" );
const pgClient = require( "../lib/pg_client" );
const dbConfig = require( "../config" );

describe( "pgClient", ( ) => {
  describe( "connect", ( ) => {
    afterEach( ( ) => {
      process.env.NODE_ENV = "test";
    } );

    it( "fails if it can't connect", ( ) => {
      const originalDbName = dbConfig.database.dbname;
      dbConfig.database.dbname = "inaturalist_nonsense";
      try {
        pgClient.connection = null;
        pgClient.connect( ( err, connection ) => {
          expect( err ).not.to.be.null;
          expect( connection ).to.be.undefined;
        } );
      } finally {
        dbConfig.database.dbname = originalDbName;
      }
    } );

    it( "uses the test database", done => {
      pgClient.connect( ( err, connection ) => {
        expect( err ).to.be.null;
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
