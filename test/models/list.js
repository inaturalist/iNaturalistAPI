const { expect } = require( "chai" );
const List = require( "../../lib/models/list" );

describe( "List", ( ) => {
  describe( "findByID", ( ) => {
    it( "returns a list given an ID", async ( ) => {
      const l = await List.findByID( 301 );
      expect( l.id ).to.eq( 301 );
      expect( l.title ).to.eq( "A List" );
    } );

    it( "returns a list from the cache", async ( ) => {
      const l = await List.findByID( 301 );
      expect( l.id ).to.eq( 301 );
      expect( l.title ).to.eq( "A List" );
    } );

    it( "returns false for unknown IDs", async ( ) => {
      const l = await List.findByID( 10101 );
      expect( l ).to.be.false;
    } );
  } );

  describe( "taxonIDs", ( ) => {
    it( "returns taxonIDs", async ( ) => {
      const l = await List.findByID( 301 );
      const taxonIDs = await l.taxonIDs( );
      expect( taxonIDs.sort( ) ).to.deep.eq( [401, 402] );
    } );

    it( "returns cached taxonIDs", async ( ) => {
      const l = await List.findByID( 301 );
      const taxonIDs = await l.taxonIDs( );
      expect( taxonIDs.sort( ) ).to.deep.eq( [401, 402] );
    } );
  } );
} );
