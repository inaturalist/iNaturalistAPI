const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const _ = require( "lodash" );
const Place = require( "../../lib/models/place" );

const { expect } = chai;
chai.use( chaiAsPromised );

describe( "Place", ( ) => {
  describe( "constructor", ( ) => {
    it( "creates a place", ( ) => {
      const p = new Place( { id: 111, name: "itsname" } );
      expect( p.id ).to.eq( 111 );
      expect( p.name ).to.eq( "itsname" );
    } );
  } );

  describe( "findByID", ( ) => {
    it( "returns a place given an ID", async ( ) => {
      const p = await Place.findByID( 123 );
      expect( p.id ).to.eq( 123 );
      expect( p.name ).to.eq( "itsname" );
    } );

    it( "returns a place from the cache", async ( ) => {
      const p = await Place.findByID( 123 );
      expect( p.id ).to.eq( 123 );
      expect( p.name ).to.eq( "itsname" );
    } );

    it( "returns an error given a bad ID", async ( ) => {
      await expect( Place.findByID( "notanint" ) ).to.be.rejectedWith( Error );
    } );

    it( "returns null given an unknown ID", async ( ) => {
      const p = await Place.findByID( 5 );
      expect( p ).to.eq( null );
    } );
  } );

  describe( "assignToObject", ( ) => {
    it( "assigns place instances to objects", done => {
      const o = { 1: { }, 123: { }, 432: { } };
      Place.assignToObject( o ).then( ( ) => {
        expect( _.keys( o ) ).to.deep.eq( ["1", "123", "432"] );
        expect( o["1"].id ).to.eq( 1 );
        expect( o["123"].id ).to.be.undefined;
        expect( o["432"].display_name ).to.eq( "a-place" );
        done( );
      } );
    } );
  } );
} );
