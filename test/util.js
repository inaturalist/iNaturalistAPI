var expect = require( "chai" ).expect,
    util = require( "../lib/util" );

describe( "util", function( ) {

  describe( "debug", function( ) {
    it( "writes to console.log", function( ) {
      expect( util.debug( "      (pass)" ) ).to.be.undefined;
    });
  });

  describe( "pp", function( ) {
    it( "writes to compclidated objects", function( ) {
      expect( util.pp( { just: { a: { test: { } } } } ) ).to.be.undefined;
    });
  });

});
