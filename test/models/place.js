const { expect } = require( "chai" );
const _ = require( "lodash" );
const Place = require( "../../lib/models/place" );

describe( "Place", ( ) => {
  describe( "constructor", ( ) => {
    it( "creates a place", ( ) => {
      const p = new Place( { id: 111, name: "itsname" } );
      expect( p.id ).to.eq( 111 );
      expect( p.name ).to.eq( "itsname" );
    } );
  } );

  describe( "findByID", ( ) => {
    it( "returns a place given an ID", done => {
      Place.findByID( 123, ( err, p ) => {
        expect( p.id ).to.eq( 123 );
        expect( p.name ).to.eq( "itsname" );
        done( );
      } );
    } );

    it( "returns a place from the cache", done => {
      Place.findByID( 123, ( err, p ) => {
        expect( p.id ).to.eq( 123 );
        expect( p.name ).to.eq( "itsname" );
        done( );
      } );
    } );

    it( "returns an error given a bad ID", done => {
      Place.findByID( "notanint", err => {
        expect( err ).to.deep.eq( { messsage: "invalid place_id", status: 422 } );
        done( );
      } );
    } );

    it( "returns null given an unknown ID", done => {
      Place.findByID( 5, ( err, p ) => {
        expect( err ).to.eq( null );
        expect( p ).to.eq( false );
        done( );
      } );
    } );
  } );

  describe( "assignToObject", ( ) => {
    it( "assigns place instances to objects", done => {
      const o = { 1: { }, 123: { }, 432: { } };
      Place.assignToObject( o, ( err, withPlaces ) => {
        expect( _.keys( withPlaces ) ).to.deep.eq( ["1", "123", "432"] );
        expect( withPlaces["1"].display_name ).to.be.undefined;
        expect( withPlaces["123"].display_name ).to.be.undefined;
        expect( withPlaces["432"].display_name ).to.eq( "a-place" );
        done( );
      } );
    } );
  } );
} );
