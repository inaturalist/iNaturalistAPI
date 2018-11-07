const { expect } = require( "chai" );
const Fave = require( "../../lib/models/fave" );

describe( "Fave", ( ) => {
  describe( "constructor", ( ) => {
    it( "creates a Fave", ( ) => {
      const f = new Fave( { id: 111 } );
      expect( f.id ).to.eq( 111 );
    } );
  } );
} );
