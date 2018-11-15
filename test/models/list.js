const { expect } = require( "chai" );
const List = require( "../../lib/models/list" );

describe( "List", ( ) => {
  describe( "findByID", ( ) => {
    it( "returns a list given an ID", done => {
      List.findByID( 301, ( err, l ) => {
        expect( l.id ).to.eq( 301 );
        expect( l.title ).to.eq( "A List" );
        done( );
      } );
    } );

    it( "returns a list from the cache", done => {
      List.findByID( 301, ( err, p ) => {
        expect( p.id ).to.eq( 301 );
        expect( p.title ).to.eq( "A List" );
        done( );
      } );
    } );

    it( "returns false for unknown IDs", done => {
      List.findByID( 10101, ( err, l ) => {
        expect( err ).to.eq( null );
        expect( l ).to.be.false;
        done( );
      } );
    } );
  } );

  describe( "taxonIDs", ( ) => {
    it( "returns taxonIDs", done => {
      List.findByID( 301, ( err, l ) => {
        l.taxonIDs( ( errr, ids ) => {
          expect( ids.sort( ) ).to.deep.eq( [401, 402] );
          done( );
        } );
      } );
    } );

    it( "returns cached taxonIDs", done => {
      List.findByID( 301, ( err, l ) => {
        l.taxonIDs( ( errr, ids ) => {
          expect( ids.sort( ) ).to.deep.eq( [401, 402] );
          done( );
        } );
      } );
    } );
  } );
} );
