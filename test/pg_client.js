const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const pgClient = require( "../lib/pg_client" );

const { expect } = chai;
chai.use( chaiAsPromised );

describe( "pgClient", ( ) => {
  describe( "connect", ( ) => {
    afterEach( ( ) => {
      process.env.NODE_ENV = "test";
    } );

    it( "fails if it can't connect", async ( ) => {
      process.env.NODE_ENV = "nonsense";
      pgClient.connection = null;
      await expect( pgClient.connect( ) ).to.be.rejectedWith( Error );
    } );

    it( "uses the test database", async ( ) => {
      const connection = await pgClient.connect( );
      expect( connection.database ).to.eq( "inaturalist_test" );
    } );

    it( "returns the open connection", async ( ) => {
      const connection1 = await pgClient.connect( );
      expect( connection1.processID ).to.not.be.undefined;
      const connection2 = await pgClient.connect( );
      expect( connection1.processID ).to.eq( connection2.processID );
      expect( connection1 ).to.eq( connection2 );
    } );
  } );
} );
