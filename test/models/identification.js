var expect = require( "chai" ).expect,
    Identification = require( "../../lib/models/identification" );

describe( "Identification", function( ) {
  describe( "constructor", function( ) {
    it( "creates an Identification", function( ) {
      var i = new Identification({ id: 111 });
      expect( i.id ).to.eq( 111 );
    });
  });
});
