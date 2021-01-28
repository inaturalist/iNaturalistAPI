const { expect } = require( "chai" );
const Model = require( "../../lib/models/model" );

describe( "Model", ( ) => {
  describe( "constructor", ( ) => {
    it( "populates attributes", ( ) => {
      const m = new Model( { id: 111 } );
      expect( m.id ).to.eq( 111 );
    } );

    it( "uses a consistent format for dates", ( ) => {
      let m = new Model( { updated_at: new Date( "2016-01-01 00:00:00 +00:00" ) } );
      expect( m.updated_at ).to.eq( "2016-01-01T00:00:00+00:00" );
      m = new Model( { updated_at: "2016-01-01T00:00:00" } );
      expect( m.updated_at ).to.eq( "2016-01-01T00:00:00+00:00" );
    } );

    it( "does not parse dates in fields that don't look like dates", ( ) => {
      const body1 = "2016-01-01 00:00:00 +00:00";
      let m = new Model( { body: body1 } );
      expect( m.body ).to.eq( body1 );
      const body2 = "2016-01-01T00:00:00";
      m = new Model( { body: body2 } );
      expect( m.body ).to.eq( body2 );
    } );
  } );
} );
