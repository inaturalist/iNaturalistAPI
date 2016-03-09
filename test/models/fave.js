var expect = require( "chai" ).expect,
    Fave = require( "../../lib/models/fave" );

describe( "Fave", function( ) {
  describe( "constructor", function( ) {
    it( "creates a Fave", function( ) {
      var f = new Fave({ id: 111 });
      expect( f.id ).to.eq( 111 );
    });
  });
});
