"use strict";
var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    nock = require( "nock" ),
    fs = require( "fs" ),
    jwt = require( "jsonwebtoken" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    config = require( "../../../config.js" ),
    app = iNaturalistAPI.server( ),
    _ = require( "underscore" );

var fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Observations", function( ) {

  describe( "show", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/1" ).expect( function( res ) {
        expect( res.body.results[ 0 ].identifications.length ).to.be.above( 0 );
        // unauthenticated users don't get private info
        expect( res.body.results[ 0 ].private_location ).to.be.undefined;
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "shows authenticated users their own private info", function( done ) {
      var token = jwt.sign({ user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/1" ).set( "Authorization", token ).expect( ( res ) => {
        expect( res.body.results[ 0 ].private_location ).to.not.be.undefined;
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "does not show authenticated users others' private info", function( done ) {
      var token = jwt.sign({ user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/333" ).set( "Authorization", token ).expect( ( res ) => {
        expect( res.body.results[ 0 ].private_location ).to.be.undefined;
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "create", function( ) {
    it( "returns private coordinates when geoprivacy is private", function( done ) {
      var fixtureObs = fixtures.elasticsearch.observations.observation[5];
      expect( fixtureObs.geoprivacy ).to.eq( "private" );
      expect( fixtureObs.location ).to.be.undefined;
      var token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      nock( "http://localhost:3000" ).
        post( "/observations" ).
        reply( 200, [ { id: fixtureObs.id } ] );
      request( app ).post( "/v1/observations", {
        // it doesn't really matter what we post since we're just stubbing the
        // Rails app to return obs 6 to load from the ES index
      } ).set( "Authorization", token ).expect( res => {
        expect( res.body.private_geojson.coordinates[1] ).to.eq( fixtureObs.private_geojson.coordinates[1] );
        expect( res.body.private_location ).not.to.be.undefined;
        expect( res.body.private_location ).to.eq( fixtureObs.private_location );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } )
  } );

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
        // identifications are not part of the default search response
        expect( res.body.results[ 0 ].identifications ).to.be.undefined;
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

    it( "finds observations by taxon_id", function( done ) {
      request( app ).get( "/v1/observations?taxon_id=4" ).
      expect( function( res ) {
        expect( res.body.results.map( function( r ) { return r.id } ) ).to.contain( 1 );
      }).expect( 200, done );
    } );

    it( "finds observations by without_taxon_id", function( done) {
      request( app ).get( "/v1/observations?taxon_id=4&without_taxon_id=5" ).
      expect( function( res ) {
        expect( res.body.results.map( function( r ) { return r.id } ) ).to.contain( 2 );
        expect( res.body.results.map( function( r ) { return r.id } ) ).not.to.contain( 1 );
      }).expect( 200, done );
    } );

    it( "finds observations by multiple without_taxon_id", function( done) {
      request( app ).get( "/v1/observations?without_taxon_id=4,5" ).
      expect( function( res ) {
        expect( res.body.results.map( function( r ) { return r.id } ) ).to.contain( 333 );
        expect( res.body.results.map( function( r ) { return r.id } ) ).not.to.contain( 2 );
        expect( res.body.results.map( function( r ) { return r.id } ) ).not.to.contain( 1 );
      }).expect( 200, done );
    } );

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

    it( "return iconic taxon names", function( done ) {
      request( app ).get( "/v1/observations?id=1" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
        expect( res.body.results[ 0 ].taxon.iconic_taxon_id ).to.eq( 101 );
        expect( res.body.results[ 0 ].taxon.iconic_taxon_name ).to.eq( "Actinopterygii" );
      }).expect( 200, done );
    });

    it( "does not strips place guess from obscured observations", function( done ) {
      request( app ).get( "/v1/observations?geoprivacy=obscured_private" ).
      expect( function( res ) {
        var o = _.find( res.body.results, function( r ) { return r.id === 333; } );
        expect( o.place_guess ).to.eq( "Idaho" );
      }).expect( 200, done );
    });

    it( "filters by sounds", function( done ) {
      request( app ).get( "/v1/observations?sounds=true" ).
      expect( function( res ) {
        expect( res.body.results.length ).to.eq( 1 );
      } ).expect( 200, done );
    } );

    it( "filters by captive", function( done ) {
      request( app ).get( "/v1/observations?sounds=true" ).
      expect( function( res ) {
        expect( res.body.results.map( r => r.id ).indexOf( 5 ) ).to.be.defined; // captive
        expect( res.body.results.map( r => r.id ).indexOf( 1 ) ).to.eq( -1 ); // not-captive
      } ).expect( 200, done );
    } );

    it( "filters by not captive", function( done ) {
      request( app ).get( "/v1/observations?captive=false" ).
      expect( function( res ) {
        expect( res.body.results.map( r => r.id ).indexOf( 5 ) ).to.eq( -1 ); // captive
        expect( res.body.results.map( r => r.id ).indexOf( 1 ) ).to.be.defined; // not-captive
      } ).expect( 200, done );
    } );

    it( "filters by captive=any", function( done ) {
      request( app ).get( "/v1/observations?captive=any" ).
      expect( function( res ) {
        expect( res.body.results.map( r => r.id ).indexOf( 5 ) ).to.be.defined; // captive
        expect( res.body.results.map( r => r.id ).indexOf( 1 ) ).to.be.defined; // not-captive
      } ).expect( 200, done );
    } );

    it( "includes soundcloud identifiers", function( done ) {
      request( app ).get( "/v1/observations?sounds=true" ).
      expect( function( res ) {
        expect( res.body.results.native_sound_id ).to.be.defined;
      } ).expect( 200, done );
    } );

    it( "can return full details on searches", function( done ) {
      request( app ).get( "/v1/observations?id=1&details=all" ).
      expect( function( res ) {
        expect( res.body.results[ 0 ].identifications.length ).to.be.above( 0 );
      }).expect( 200, done );
    });

    it( "returns a bounding box if you request one", function( done ) {
     request( app ).get( "/v1/observations?return_bounds=true" ).
     expect( function( res ) {
      expect( res.body.total_bounds ).to.be.defined;
      expect( res.body.total_bounds.swlng ).to.be.defined;
     } ).expect( 200, done );
    } );
    it( "doesn't return a bounding box if you don't request one", function( done ) {
      request( app ).get( "/v1/observations" ).
      expect( function( res ) {
       expect( res.body.total_bounds ).to.be.undefined;
      } ).expect( 200, done );
    } );
    it( "doesn't return a bounding box if there are no observations", function( done ) {
      request( app ).get( "/v1/observations?user_id=9999" ).
      expect( function( res ) {
       expect( res.body.total_bounds ).to.be.undefined;
      } ).expect( 200, done );
    } );
  });

  describe( "histogram", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/histogram" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
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

  describe( "species_counts", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/species_counts" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "sorts by count desc by default", function( done ) {
      request( app ).get( "/v1/observations/species_counts" ).expect( function( res ) {
        expect( res.body.results[0].count ).to.eq( 2 );
        expect( res.body.results[1].count ).to.eq( 1 );
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "can sort by count asc", function( done ) {
      request( app ).get( "/v1/observations/species_counts?order=asc" ).expect( function( res ) {
        expect( res.body.results[0].count ).to.eq( 1 );
        expect( res.body.results[1].count ).to.eq( 2 );
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns taxa unobserved by a user", function( done ) {
      request( app ).get( "/v1/observations/species_counts?unobserved_by_user_id=1&lat=50&lng=50" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].count ).to.eq( 1 );
          expect( res.body.results[0].taxon.id ).to.eq( 123 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "iconic_taxa_counts", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/iconic_taxa_counts" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "iconic_taxa_species_counts", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/iconic_taxa_species_counts" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "updates", function( ) {
    it( "fails for unauthenticated requests", function( done ) {
      request( app ).get( "/v1/observations/updates" ).expect( function( res ) {
        expect( res.error.text ).to.eq( '{"error":"Unauthorized","status":401}' );
      }).expect( "Content-Type", /json/ ).expect( 401, done );
    });

    it( "allows authenticated requests", function( done ) {
      var token = jwt.sign({ user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates" ).set( "Authorization", token ).expect( res => {
        expect( res.err ).to.be.undefined;
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "shows updates on obs by viewer and not by viewer by default", function( done ) {
      const ownerId = 123;
      var token = jwt.sign({ user_id: ownerId }, config.jwtSecret || "secret", { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates" ).set( "Authorization", token ).expect( res => {
        expect( res.body.results.find( r => r.resource_owner_id === ownerId ) ).to.exist;
        expect( res.body.results.find( r => r.resource_owner_id !== ownerId ) ).to.exist;
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
    it( "filters on obs by viewer", function( done ) {
      const ownerId = 123;
      var token = jwt.sign({ user_id: ownerId }, config.jwtSecret || "secret", { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates?observations_by=owner" ).set( "Authorization", token ).expect( res => {
        expect( res.body.results.find( r => r.resource_owner_id === ownerId ) ).to.exist;
        expect( res.body.results.find( r => r.resource_owner_id !== ownerId ) ).to.not.exist;
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
    it( "filters on obs by following", function( done ) {
      const ownerId = 123;
      var token = jwt.sign({ user_id: ownerId }, config.jwtSecret || "secret", { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates?observations_by=following" ).set( "Authorization", token ).expect( res => {
        expect( res.body.results.find( r => r.resource_owner_id !== ownerId ) ).to.exist;
        expect( res.body.results.find( r => r.resource_owner_id === ownerId ) ).to.not.exist;
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  });

  describe( "deleted", function( ) {
    it( "fails for unauthenticated requests", function( done ) {
      request( app ).get( "/v1/observations/deleted" ).expect( function( res ) {
        expect( res.error.text ).to.eq( '{"error":"Unauthorized","status":401}' );
      }).expect( "Content-Type", /json/ ).expect( 401, done );
    });

    it( "returns an empty array without a since param", function( done ) {
      var token = jwt.sign({ user_id: 1 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/deleted" ).set( "Authorization", token ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 0 );
        expect( res.body.page ).to.eq( 1 );
        expect( res.body.per_page ).to.eq( 500 );
        expect( res.body.results.length ).to.eq( 0 );
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns observations deleted since date", function( done ) {
      var token = jwt.sign({ user_id: 1 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/deleted?since=2016-01-01" ).set( "Authorization", token ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 3 );
        expect( res.body.results.length ).to.eq( 3 );
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

});
