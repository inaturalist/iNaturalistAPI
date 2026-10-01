const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const sinon = require( "sinon" );
const qdrantClient = require( "../lib/qdrant_client" );

const { expect } = chai;
chai.use( chaiAsPromised );

describe( "qdrantClient", ( ) => {
  afterEach( ( ) => {
    sinon.restore( );
  } );

  describe( "connect", ( ) => {
    it( "returns the open connection", async ( ) => {
      sinon.stub( qdrantClient, "connection" ).value( null );
      sinon.stub( qdrantClient, "lastConnectCheck" ).value( 0 );
      const connection1 = await qdrantClient.connect( );
      expect( connection1.constructor.name ).to.eql( "QdrantClient" );
      const connection2 = await qdrantClient.connect( );
      expect( connection1 ).to.eql( connection2 );
    } );

    it( "does not attempt to reconnect within connectRetryDelay seconds", async ( ) => {
      const previousConnectTime = Date.now( ) - 1000;
      sinon.stub( qdrantClient, "connection" ).value( null );
      sinon.stub( qdrantClient, "lastConnectCheck" ).value( previousConnectTime );
      expect( qdrantClient.connected( ) ).to.be.false;

      expect( await qdrantClient.connect( ) ).to.be.null;
      expect( qdrantClient.connected( ) ).to.be.false;
      expect( qdrantClient.lastConnectCheck ).to.eq( previousConnectTime );
    } );

    it( "does reconnect after connectRetryDelay seconds", async ( ) => {
      const previousConnectTime = Date.now( ) - ( qdrantClient.connectRetryDelay * 1000 ) - 1000;
      sinon.stub( qdrantClient, "connection" ).value( null );
      sinon.stub( qdrantClient, "lastConnectCheck" ).value( previousConnectTime );
      expect( qdrantClient.connected( ) ).to.be.false;

      expect( await qdrantClient.connect( ) ).not.to.be.null;
      expect( qdrantClient.connected( ) ).to.be.true;
      expect( qdrantClient.lastConnectCheck ).to.be.above( previousConnectTime );
    } );
  } );

  describe( "query", ( ) => {
    it( "returns an empty object if there is no connection and it cannot connect", async ( ) => {
      sinon.stub( qdrantClient, "connection" ).value( null );
      const connectStub = sinon.stub( qdrantClient, "connect" );
      connectStub.resolves( null );
      expect( qdrantClient.connected( ) ).to.be.false;

      expect( await qdrantClient.query( "taxon_photos", { } ) ).to.deep.eq( { } );
      expect( qdrantClient.connected( ) ).to.be.false;
    } );

    it( "attempts to reconnect if not connected", async ( ) => {
      sinon.stub( qdrantClient, "connection" ).value( null );
      sinon.stub( qdrantClient, "lastConnectCheck" ).value( 0 );
      expect( qdrantClient.connected( ) ).to.be.false;
      sinon.stub( qdrantClient, "connection" ).value( {
        query: sinon.stub( ).resolves( { } )
      } );

      await qdrantClient.query( "taxon_photos", { } );
      expect( qdrantClient.connected( ) ).to.be.true;
    } );

    it( "drops the connection when a query hits a network failure", async ( ) => {
      sinon.stub( qdrantClient, "connection" ).value( {
        query: sinon.stub( ).rejects( new TypeError( "fetch failed" ) )
      } );
      expect( await qdrantClient.query( "taxon_photos", { } ) ).to.deep.eq( { } );
      expect( qdrantClient.connected( ) ).to.be.false;
    } );

    it( "rethrows errors other than network failures", async ( ) => {
      sinon.stub( qdrantClient, "connection" ).value( {
        query: sinon.stub( ).rejects( new Error( "bad request" ) )
      } );
      await expect( qdrantClient.query( "taxon_photos", { } ) ).to.be.rejectedWith( "bad request" );
      expect( qdrantClient.connected( ) ).to.be.true;
    } );
  } );
} );
