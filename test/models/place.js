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

  describe( "findByLocaleCode", ( ) => {
    it( "returns a place given a code", async ( ) => {
      const p = await Place.findByLocaleCode( "LP" );
      expect( p.id ).to.eq( 511 );
      expect( p.name ).to.eq( "locale-place" );
      expect( p.ancestor_place_ids.length ).to.eq( 2 );
      expect( p.ancestor_place_ids[0] ).to.eq( 111 );
      expect( p.ancestor_place_ids[1] ).to.eq( 511 );
    } );

    it( "returns null if admin_level is not country", async ( ) => {
      const p = await Place.findByLocaleCode( "LPA" );
      expect( p ).to.eq( null );
    } );

    it( "returns null given an unknown code", async ( ) => {
      const p = await Place.findByLocaleCode( "US" );
      expect( p ).to.eq( null );
    } );
  } );

  describe( "assignToObject", ( ) => {
    it( "assigns place instances to objects", done => {
      const o = { 1: { }, 123: { }, 432: { } };
      Place.assignToObject( o ).then( ( ) => {
        expect( _.keys( o ) ).to.deep.eq( ["1", "123", "432"] );
        expect( o["1"].display_name ).to.be.undefined;
        expect( o["123"].display_name ).to.be.undefined;
        expect( o["432"].display_name ).to.eq( "a-place" );
        done( );
      } );
    } );
  } );
} );
