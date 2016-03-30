var expect = require( "chai" ).expect,
    Model = require( "../../lib/models/model" );

describe( "Model", function( ) {

  describe( "constructor", function( ) {
    it( "populates attributes", function( ) {
      var m = new Model({ id: 111 });
      expect( m.id ).to.eq( 111 );
    });

    it( "uses a consistent format for dates", function( ) {
      var m = new Model({ d: new Date("2016-01-01 00:00:00 +00:00") });
      expect( m.d ).to.eq( "2016-01-01T00:00:00+00:00" );
      m = new Model({ d: "2016-01-01T00:00:00" });
      expect( m.d ).to.eq( "2016-01-01T00:00:00+00:00" );
    });
  });

});
