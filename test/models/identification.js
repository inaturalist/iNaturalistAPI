const { expect } = require( "chai" );
const Identification = require( "../../lib/models/identification" );

describe( "Identification", ( ) => {
  describe( "constructor", ( ) => {
    it( "creates an Identification", ( ) => {
      const i = new Identification( { id: 111 } );
      expect( i.id ).to.eq( 111 );
    } );
  } );

  describe( "preloadInto", ( ) => {
    it( "adds Identification instances", done => {
      const arr = [{ identification_id: 102 }];
      Identification.preloadInto( arr, { }, () => {
        expect( arr[0].identification ).to.not.be.undefined;
        done( );
      } );
    } );
  } );
} );
