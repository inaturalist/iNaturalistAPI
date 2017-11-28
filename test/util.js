var expect = require( "chai" ).expect,
    util = require( "../lib/util" );

describe( "util", function( ) {

  describe( "renderError", function( ) {
    it( "renders a generic exception", function( done ) {
      var res = expectError({ error: "Error", status: 500 }, done );
      util.renderError( "      testing renderError", res );
    });

    it( "renders a custom exception", function( done ) {
      var e = { error: "testing", status: 501 };
      var res = expectError( e, done );
      util.renderError( e, res );
    });
  });

  describe( "debug", function( ) {
    it( "writes to console.log", function( ) {
      expect( util.debug( "      testing debug" ) ).to.be.undefined;
    });
  });

  describe( "pp", function( ) {
    it( "writes to compclidated objects", function( ) {
      expect( util.pp( { just: { a: { test: { } } } } ) ).to.be.undefined;
    });
  });

  describe( "capitalize", function( ) {
    it( "capitalizes only the first letter", function( ) {
      expect( util.capitalize( "helloWorld" ) ).to.eq( "Helloworld");
    });
  });

  describe( "localeOpts", function( ) {
    it( "defaults to en", function( ) {
      var opts = util.localeOpts({ query: { } });
      expect( opts.locale ).to.eq( "en" );
    });

    it( "uses the specified locale", function( ) {
      var opts = util.localeOpts({ query: { locale: "de" } });
      expect( opts.locale ).to.eq( "de" );
    });

    it( "sets places", function( ) {
      var req = { query: { }, inat: { place: "PL", preferredPlace: "PPL" } };
      var opts = util.localeOpts( req );
      expect( opts.place ).to.eq( "PL" );
      expect( opts.preferredPlace ).to.eq( "PPL" );
    });

    it( "sets locale based on user session", function( ) {
      var req = { query: { }, inat: { }, userSession: { locale: "de" } };
      var opts = util.localeOpts( req );
      expect( opts.locale ).to.eq( "de" );
    });

    it( "sets preferredPlace based on user session", function( ) {
      var req = { query: { }, inat: { }, userSession: { preferredPlace: { id: 111 } } };
      var opts = util.localeOpts( req );
      expect( opts.preferredPlace.id ).to.eq( 111 );
    });

    it( "overrides user session locale with params", function( ) {
      var req = { query: { locale: "es" }, inat: { }, userSession: { locale: "de" } };
      var opts = util.localeOpts( req );
      expect( opts.locale ).to.eq( "es" );
    });

    it( "overrides user session place with params", function( ) {
      var req = { query: { }, inat: { place: "PL", preferredPlace: "PPL" },
        userSession: { preferredPlace: { id: 111 } } };
      var opts = util.localeOpts( req );
      expect( opts.place ).to.eq( "PL" );
      expect( opts.preferredPlace ).to.eq( "PPL" );
    });
  });
});

function expectError( e, done ) {
  var res = {
    status: function( ) { },
    jsonp : function( j ) {
      expect( j ).to.deep.eq( e );
      done( );
    }
  };
  return res;
}
