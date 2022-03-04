const { expect } = require( "chai" );
const util = require( "../lib/util" );

function expectError( e, done ) {
  const res = {
    status: ( ) => { },
    jsonp: j => {
      expect( j ).to.deep.eq( e );
      done( );
    }
  };
  return res;
}

describe( "util", ( ) => {
  describe( "renderError", ( ) => {
    it( "renders a generic exception", done => {
      const res = expectError( { error: "Error", status: 500 }, done );
      util.renderError( "      testing renderError", res );
    } );

    it( "renders a custom exception", done => {
      const e = { error: "testing", status: 501 };
      const res = expectError( e, done );
      util.renderError( e, res );
    } );
  } );

  describe( "debug", ( ) => {
    it( "writes to console.log", ( ) => {
      expect( util.debug( "      testing debug" ) ).to.be.undefined;
    } );
  } );

  describe( "pp", ( ) => {
    it( "writes to compclidated objects", ( ) => {
      expect( util.pp( { just: { a: { test: { } } } } ) ).to.be.undefined;
    } );
  } );

  describe( "capitalize", ( ) => {
    it( "capitalizes only the first letter", ( ) => {
      expect( util.capitalize( "helloWorld" ) ).to.eq( "Helloworld" );
    } );
  } );

  describe( "localeOpts", ( ) => {
    it( "defaults to en", ( ) => {
      const opts = util.localeOpts( { query: { } } );
      expect( opts.locale ).to.eq( "en" );
    } );

    it( "uses the specified locale", ( ) => {
      const opts = util.localeOpts( { query: { locale: "de" } } );
      expect( opts.locale ).to.eq( "de" );
    } );

    it( "sets places", ( ) => {
      const req = { query: { }, inat: { place: "PL", preferredPlace: "PPL" } };
      const opts = util.localeOpts( req );
      expect( opts.place ).to.eq( "PL" );
      expect( opts.preferredPlace ).to.eq( "PPL" );
    } );

    it( "sets locale based on user session", ( ) => {
      const req = { query: { }, inat: { }, userSession: { locale: "de" } };
      const opts = util.localeOpts( req );
      expect( opts.locale ).to.eq( "de" );
    } );

    it( "sets preferredPlace based on user session", ( ) => {
      const req = { query: { }, inat: { }, userSession: { preferredPlace: { id: 111 } } };
      const opts = util.localeOpts( req );
      expect( opts.preferredPlace.id ).to.eq( 111 );
    } );

    it( "overrides user session locale with params", ( ) => {
      const req = { query: { locale: "es" }, inat: { }, userSession: { locale: "de" } };
      const opts = util.localeOpts( req );
      expect( opts.locale ).to.eq( "es" );
    } );

    it( "overrides user session place with params", ( ) => {
      const req = {
        query: { },
        inat: { place: "PL", preferredPlace: "PPL" },
        userSession: { preferredPlace: { id: 111 } }
      };
      const opts = util.localeOpts( req );
      expect( opts.place ).to.eq( "PL" );
      expect( opts.preferredPlace ).to.eq( "PPL" );
    } );

    it( "sets iw to he", ( ) => {
      const opts = util.localeOpts( { query: { locale: "iw" } } );
      expect( opts.locale ).to.eq( "he" );
    } );

    it( "sets iw-IL to he-IL", ( ) => {
      const opts = util.localeOpts( { query: { locale: "iw-IL" } } );
      expect( opts.locale ).to.eq( "he-il" ); // not sure why it's lowercase...
    } );
  } );
} );
