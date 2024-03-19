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

  describe( "userAgentClient", ( ) => {
    it( "returns nil when request user agent is empty", ( ) => {
      expect( util.userAgentClient( { headers: { } } ) ).to.be.null;
      expect( util.userAgentClient( { headers: { "user-agent": null } } ) ).to.be.null;
      expect( util.userAgentClient( { headers: { "user-agent": "" } } ) ).to.be.null;
    } );

    it( "returns nil when request user agent is unrecognized", ( ) => {
      expect( util.userAgentClient( { headers: { "user-agent": "nonsense" } } ) ).to.be.null;
    } );

    it( "recognizes inatrn client user agents", ( ) => {
      expect( util.userAgentClient( {
        headers: {
          "user-agent": "iNaturalistReactNative/60 CFNetwork/1474 Darwin/23.0.0"
        }
      } ) ).to.eq( "inatrn" );
      expect( util.userAgentClient( {
        headers: {
          "user-agent": "iNaturalistRN/0.14.0 Handset (Build 60) iOS/17.0.3"
        }
      } ) ).to.eq( "inatrn" );
    } );

    it( "recognizes seek client user agents", ( ) => {
      expect( util.userAgentClient( {
        headers: {
          "user-agent": "Seek/2.15.3 Handset (Build 316) iOS/17.0.3"
        }
      } ) ).to.eq( "seek" );
      expect( util.userAgentClient( {
        headers: {
          "user-agent": "Seek/2.15.3 Handset (Build 316) Android/13"
        }
      } ) ).to.eq( "seek" );
    } );

    it( "recognizes inat-ios client user agents", ( ) => {
      expect( util.userAgentClient( {
        headers: {
          "user-agent": "iNaturalist/708 CFNetwork/1410.0.3 Darwin/22.6.0"
        }
      } ) ).to.eq( "inat-ios" );
    } );

    it( "recognizes inat-android client user agents", ( ) => {
      expect( util.userAgentClient( {
        headers: {
          "user-agent": "iNaturalist/1.29.18 (Build 592; Android 5.10.157-android13-4-00001-g5c7ff5dc7aac-ab10381520 10754064; SDK 34; bluejay Pixel 6a bluejay; OS Version 14)"
        }
      } ) ).to.eq( "inat-android" );
    } );

    it( "returns nil for unrecognized user agents", ( ) => {
      expect( util.userAgentClient( {
        headers: {
          "user-agent": "nonsense"
        }
      } ) ).to.be.null;
    } );
  } );

  describe( "observationSearchRequestCacheKey", ( ) => {
    it( "returns a cache key for cacheable queries", ( ) => {
      const req = {
        query: {
          page: "1",
          return_bounds: "true"
        }
      };
      expect( util.observationSearchRequestCacheKey( req, "ObservationsController.search", {
        enableInTestEnv: true
      } ) ).to.eq( "ObservationsController.search-returnBounds-true" );
    } );

    it( "allows queries with place_id to be cached for obs search", ( ) => {
      const req = {
        query: {
          place_id: 1
        }
      };
      expect( util.observationSearchRequestCacheKey( req, "ObservationsController.search", {
        enableInTestEnv: true
      } ) ).to.eq( "ObservationsController.search-placeID-1" );
    } );

    it( "does not allow queries with place_id to be cached for obs search when logged in", ( ) => {
      const req = {
        query: {
          place_id: 1
        },
        userSession: {
          user_id: 1
        }
      };
      expect( util.observationSearchRequestCacheKey( req, "ObservationsController.search", {
        enableInTestEnv: true
      } ) ).to.be.null;
    } );

    it( "includes locale in cache key for obs search by default", ( ) => {
      const req = {
        query: {
          locale: "en"
        }
      };
      expect( util.observationSearchRequestCacheKey( req, "ObservationsController.search", {
        enableInTestEnv: true
      } ) ).to.eq( "ObservationsController.search-locale-en" );
    } );

    it( "excludes locale from cache key for obs search when requested", ( ) => {
      const req = {
        query: {
          locale: "en"
        }
      };
      expect( util.observationSearchRequestCacheKey( req, "ObservationsController.search", {
        enableInTestEnv: true,
        ignoreLocalization: true
      } ) ).to.eq( "ObservationsController.search" );
    } );
  } );
} );
