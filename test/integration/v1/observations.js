var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    fs = require( "fs" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

var fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Observations", function( ) {

  describe( "show", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/1" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "search", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "looks up observation users from the DB", function( done ) {
      request( app ).get( "/v1/observations" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( fixtures.elasticsearch.observations.observation.length );
        expect( res.body.results[ 0 ].id ).to.eq( 2 );
        expect( res.body.results[ 0 ].user.id ).to.eq( 5 );
        expect( res.body.results[ 0 ].user.login ).to.eq( "b-user" );
        expect( res.body.results[ 1 ].id ).to.eq( 1 );
        expect( res.body.results[ 1 ].user.id ).to.eq( 123 );
        // login comes from the DB
        expect( res.body.results[ 1 ].user.login ).to.eq( "a-user" );
        expect( res.body.results[ 1 ].user.name ).to.eq( "A User" );
      }).expect( 200, done );
    });

    it( "finds observations by user login", function( done ) {
      request( app ).get( "/v1/observations?user_id=a-user" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "finds observations by user_id", function( done ) {
      request( app ).get( "/v1/observations?user_id=123" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "looks up projects by slug", function( done ) {
      request( app ).get( "/v1/observations?projects=a-project" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "looks up not_in_project by slug", function( done ) {
      request( app ).get( "/v1/observations?not_in_project=a-project" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( fixtures.elasticsearch.observations.observation.length - 1 );
      }).expect( 200, done );
    });

    it( "looks up multiple projects", function( done ) {
      request( app ).get( "/v1/observations?projects[]=nonsense&projects[]=a-project" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "ignores missing projects", function( done ) {
      request( app ).get( "/v1/observations?projects=nonsense" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( fixtures.elasticsearch.observations.observation.length );
      }).expect( 200, done );
    });

    it( "strips place guess from obscured observations", function( done ) {
      request( app ).get( "/v1/observations?geoprivacy=obscured_private" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
        expect( res.body.results[ 0 ].id ).to.eq( 333 );
        expect( res.body.results[ 0 ].place_guess ).to.be.undefined;
      }).expect( 200, done );
    });

    it( "return iconic taxon names", function( done ) {
      request( app ).get( "/v1/observations?id=1" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
        expect( res.body.results[ 0 ].taxon.iconic_taxon_id ).to.eq( 101 );
        expect( res.body.results[ 0 ].taxon.iconic_taxon_name ).to.eq( "Actinopterygii" );
      }).expect( 200, done );
    });

    it( "filters by sounds", function( done ) {
      request( app ).get( "/v1/observations?sounds=true" ).
      expect( function( res ) {
        expect( res.body.results.length ).to.eq( 1 );
      } ).expect( 200, done );
    } );
    it( "includes soundcloud identifiers", function( done ) {
      request( app ).get( "/v1/observations?sounds=true" ).
      expect( function( res ) {
        expect( res.body.results.native_sound_id ).to.be.defined;
      } ).expect( 200, done );
    } );
  });

  describe( "identifiers", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/identifiers" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "observers", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/observers" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "accepts an order_by param", function( done ) {
      request( app ).get( "/v1/observations/observers?order_by=species_count" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "includes user name field", function( ) {
      request( app ).get( "/v1/observations/observers" ).expect( function( res ) {
        expect( res.results[0].user.name ).to.eq( "A User" );
      });
    });
  });

  describe( "speciesCounts", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/species_counts" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });
});
