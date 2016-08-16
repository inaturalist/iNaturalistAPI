var expect = require( "chai" ).expect,
    Identification = require( "../../lib/models/identification" );

describe( "Identification", function( ) {
  describe( "constructor", function( ) {
    it( "creates an Identification", function( ) {
      var i = new Identification({ id: 111 });
      expect( i.id ).to.eq( 111 );
    });
  });

  describe( "preloadInto", function( ) {
    it( "adds Identification instances", function( done ) {
      var arr = [ { identification_id: 102 } ];
      Identification.preloadInto( arr, { }, () => {
        expect( arr[0].identification ).to.not.be.undefined;
        done( );
      } );
    });
  });

});
