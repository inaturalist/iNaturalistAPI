const { expect } = require( "chai" );
const Model = require( "../../lib/models/model" );

describe( "Model", ( ) => {
  describe( "constructor", ( ) => {
    it( "populates attributes", ( ) => {
      const m = new Model( { id: 111 } );
      expect( m.id ).to.eq( 111 );
    } );

    it( "uses a consistent format for dates", ( ) => {
      let m = new Model( { d: new Date( "2016-01-01 00:00:00 +00:00" ) } );
      expect( m.d ).to.eq( "2016-01-01T00:00:00+00:00" );
      m = new Model( { d: "2016-01-01T00:00:00" } );
      expect( m.d ).to.eq( "2016-01-01T00:00:00+00:00" );
    } );
  } );
} );
