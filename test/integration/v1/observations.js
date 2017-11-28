"use strict";
var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    nock = require( "nock" ),
    fs = require( "fs" ),
    jwt = require( "jsonwebtoken" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    config = require( "../../../config.js" ),
    app = iNaturalistAPI.server( ),
    moment = require( "moment" ),
    _ = require( "underscore" );

var fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Observations", ( ) => {

  describe( "show", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/1" ).expect( res => {
        expect( res.body.results[ 0 ].identifications.length ).to.be.above( 0 );
        // unauthenticated users don't get private info
        expect( res.body.results[ 0 ].private_location ).to.be.undefined;
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "shows authenticated users their own private info", done => {
      var token = jwt.sign({ user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/1" ).set( "Authorization", token ).expect( ( res ) => {
        expect( res.body.results[ 0 ].private_location ).to.not.be.undefined;
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "shows authenticated project curators private info if they have access", done => {
      var token = jwt.sign({ user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/10" ).set( "Authorization", token ).expect( ( res ) => {
        expect( res.body.results[ 0 ].private_location ).to.not.be.undefined;
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "does not show authenticated project curators private info if they do not have access", done => {
      var token = jwt.sign({ user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/11" ).set( "Authorization", token ).expect( ( res ) => {
        expect( res.body.results[ 0 ].private_location ).to.be.undefined;
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "does not show authenticated users others' private info", done => {
      var token = jwt.sign({ user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/333" ).set( "Authorization", token ).expect( ( res ) => {
        expect( res.body.results[ 0 ].private_location ).to.be.undefined;
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "localizes taxon names to authenticated users default settings", done => {
      var token = jwt.sign({ user_id: 124 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/4" ).set( "Authorization", token ).expect( ( res ) => {
        expect( res.body.results[ 0 ].taxon.preferred_common_name ).to.eq( "BestInCaliforniaES" );
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "create", ( ) => {
    it( "returns private coordinates when geoprivacy is private", done => {
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
    } );
    it( "works with the Bearer scheme", done => {
      var fixtureObs = fixtures.elasticsearch.observations.observation[5];
      var token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      nock( "http://localhost:3000" ).
        post( "/observations" ).
        reply( 200, [ { id: fixtureObs.id } ] );
      request( app ).post( "/v1/observations", {
        // it doesn't really matter what we post since we're just stubbing the
        // Rails app to return obs 6 to load from the ES index
      } ).set( "Authorization", `Bearer ${token}` ).expect( res => {
        expect( res.body.id ).to.eq( fixtureObs.id );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  } );

  describe( "search", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "looks up observation users from the DB", done => {
      request( app ).get( "/v1/observations" ).
      expect( res => {
        var fixtureObs = _.sortBy(
          fixtures.elasticsearch.observations.observation,
          o => o.created_at ? moment( o.created_at ) : moment( "0000-01-01" )
        ).reverse( );
        var dbUsers = fixtures.postgresql.users;
        expect( res.body.total_results ).to.eq( fixtureObs.length );
        expect( res.body.results[ 0 ].id ).to.eq( fixtureObs[0].id );
        expect( res.body.results[ 0 ].user.id ).to.eq( fixtureObs[0].user.id );
        var dbUser0 = _.find( dbUsers, u => u.id === fixtureObs[0].user.id );
        var dbUser1 = _.find( dbUsers, u => u.id === fixtureObs[1].user.id );
        expect( res.body.results[ 0 ].user.login ).to.eq( dbUser0.login );
        expect( res.body.results[ 1 ].id ).to.eq( fixtureObs[1].id );
        expect( res.body.results[ 1 ].user.id ).to.eq( fixtureObs[1].user.id );
        // login comes from the DB
        expect( res.body.results[ 1 ].user.login ).to.eq( dbUser1.login );
        expect( res.body.results[ 1 ].user.name ).to.eq( dbUser1.name );
      }).expect( 200, done );
    });

    it( "finds observations by user login", done => {
      request( app ).get( "/v1/observations?user_id=a-user" ).
      expect( res => {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "finds observations by user_id", done => {
      request( app ).get( "/v1/observations?user_id=123" ).
      expect( res => {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "finds observations by taxon_id", done => {
      request( app ).get( "/v1/observations?taxon_id=4" ).
      expect( res => {
        expect( _.map( res.body.results, "id" ) ).to.contain( 1 );
      }).expect( 200, done );
    } );

    it( "finds observations by without_taxon_id", function( done ) {
      request( app ).get( "/v1/observations?taxon_id=4&without_taxon_id=5" ).
      expect( res => {
        expect( _.map( res.body.results, "id" ) ).to.contain( 2 );
        expect( _.map( res.body.results, "id" ) ).not.to.contain( 1 );
      }).expect( 200, done );
    } );

    it( "finds observations by multiple without_taxon_id", done => {
      request( app ).get( "/v1/observations?without_taxon_id=4,5" ).
      expect( res => {
        expect( _.map( res.body.results, "id" ) ).to.contain( 333 );
        expect( _.map( res.body.results, "id" ) ).not.to.contain( 2 );
        expect( _.map( res.body.results, "id" ) ).not.to.contain( 1 );
      }).expect( 200, done );
    } );

    it( "finds observations by ident_user_id", done => {
      const userID = 121;
      request( app ).get( `/v1/observations?ident_user_id=${userID}` ).
      expect( res => {
        expect( res.body.results.length ).to.be.above( 0 );
        const obsIdentifiedByUser = _.filter( res.body.results, o =>
          _.find( o.identifications, i => i.user.id === userID ) );
        expect( obsIdentifiedByUser.length ).to.eq( res.body.results.length );
      } ).expect( 200, done );
    } );

    it( "finds observations by ident_user_id by login", done => {
      const login = "user121";
      request( app ).get( `/v1/observations?ident_user_id=${login}` ).
      expect( res => {
        expect( res.body.results.length ).to.be.above( 0 );
        const obsIdentifiedByUser = _.filter( res.body.results, o =>
          _.find( o.identifications, i => i.user.login === login ) );
        expect( obsIdentifiedByUser.length ).to.eq( res.body.results.length );
      } ).expect( 200, done );
    } );

    it( "finds observations by numerous ident_user_id", done => {
      const userIDs = [121,122];
      request( app ).get( `/v1/observations?ident_user_id=${userIDs.join( "," )}` ).
      expect( res => {
        expect( res.body.results.length ).to.be.above( 0 );
        const obsIdentifiedByUsers = _.filter( res.body.results, o =>
          _.find( o.identifications, i => userIDs.indexOf( i.user.id ) >= 0 ) );
        expect( obsIdentifiedByUsers.length ).to.eq( res.body.results.length );
        const obsIdentifiedByNeither = _.filter( res.body.results, o =>
          _.find( o.identifications, i => userIDs.indexOf( i.user.id ) < 0 ) );
        expect( obsIdentifiedByNeither.length ).to.eq( 0 );
      } ).expect( 200, done );
    } );

    it( "looks up projects by slug", done => {
      request( app ).get( "/v1/observations?projects=a-project" ).
      expect( res => {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "looks up not_in_project by slug", done => {
      request( app ).get( "/v1/observations?not_in_project=a-project" ).
      expect( res => {
        expect( res.body.total_results ).to.eq( fixtures.elasticsearch.observations.observation.length - 1 );
      }).expect( 200, done );
    });

    it( "looks up multiple projects", done => {
      request( app ).get( "/v1/observations?projects[]=nonsense&projects[]=a-project" ).
      expect( res => {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "ignores missing projects", done => {
      request( app ).get( "/v1/observations?projects=nonsense" ).
      expect( res => {
        expect( res.body.total_results ).to.eq( fixtures.elasticsearch.observations.observation.length );
      }).expect( 200, done );
    });

    it( "return iconic taxon names", done => {
      request( app ).get( "/v1/observations?id=1" ).
      expect( res => {
        expect( res.body.total_results ).to.eq( 1 );
        expect( res.body.results[ 0 ].taxon.iconic_taxon_id ).to.eq( 101 );
        expect( res.body.results[ 0 ].taxon.iconic_taxon_name ).to.eq( "Actinopterygii" );
      }).expect( 200, done );
    });

    it( "does not strips place guess from obscured observations", done => {
      request( app ).get( "/v1/observations?geoprivacy=obscured_private" ).
      expect( res => {
        var o = _.find( res.body.results, function( r ) { return r.id === 333; } );
        expect( o.place_guess ).to.eq( "Idaho" );
      }).expect( 200, done );
    });

    it( "filters by sounds", done => {
      request( app ).get( "/v1/observations?sounds=true" ).
      expect( res => {
        expect( res.body.results.length ).to.eq( 1 );
      } ).expect( 200, done );
    } );

    it( "filters by captive", done => {
      request( app ).get( "/v1/observations?sounds=true" ).
      expect( res => {
        expect( res.body.results.map( r => r.id ).indexOf( 5 ) ).to.not.be.undefined; // captive
        expect( res.body.results.map( r => r.id ).indexOf( 1 ) ).to.eq( -1 ); // not-captive
      } ).expect( 200, done );
    } );

    it( "filters by not captive", done => {
      request( app ).get( "/v1/observations?captive=false" ).
      expect( res => {
        expect( res.body.results.map( r => r.id ).indexOf( 5 ) ).to.eq( -1 ); // captive
        expect( res.body.results.map( r => r.id ).indexOf( 1 ) ).to.not.be.undefined; // not-captive
      } ).expect( 200, done );
    } );

    it( "filters by captive=any", done => {
      request( app ).get( "/v1/observations?captive=any" ).
      expect( res => {
        expect( res.body.results.map( r => r.id ).indexOf( 5 ) ).to.not.be.undefined; // captive
        expect( res.body.results.map( r => r.id ).indexOf( 1 ) ).to.not.be.undefined; // not-captive
      } ).expect( 200, done );
    } );

    it( "includes soundcloud identifiers", done => {
      request( app ).get( "/v1/observations?sounds=true" ).
      expect( res => {
        expect( res.body.results[ 0 ].sounds[0].native_sound_id ).to.not.be.undefined;
      } ).expect( 200, done );
    } );

    it( "can return full details on searches", done => {
      request( app ).get( "/v1/observations?id=1&details=all" ).
      expect( res => {
        expect( res.body.results[ 0 ].identifications.length ).to.be.above( 0 );
        expect( res.body.results[ 0 ].project_observations.length ).to.be.above( 0 );
        expect( res.body.results[ 0 ].project_observations[0].project.location ).to.eq( "22,33" );
        expect( res.body.results[ 0 ].project_observations[0].project.latitude ).to.eq( "22" );
        expect( res.body.results[ 0 ].project_observations[0].project.longitude ).to.eq( "33" );
      }).expect( 200, done );
    });

    it( "returns a bounding box if you request one", done => {
     request( app ).get( "/v1/observations?return_bounds=true" ).
     expect( res => {
      expect( res.body.total_bounds ).to.not.be.undefined;
      expect( res.body.total_bounds.swlng ).to.not.be.undefined;
     } ).expect( 200, done );
    } );

    it( "doesn't return a bounding box if you don't request one", done => {
      request( app ).get( "/v1/observations" ).
      expect( res => {
       expect( res.body.total_bounds ).to.be.undefined;
      } ).expect( 200, done );
    } );

    it( "doesn't return a bounding box if there are no observations", done => {
      request( app ).get( "/v1/observations?user_id=9999" ).
      expect( res => {
       expect( res.body.total_bounds ).to.be.undefined;
      } ).expect( 200, done );
    } );

    it( "finds observations with fields", done => {
      request( app ).get( "/v1/observations?field:Habitat" ).
      expect( res => {
        expect( _.map( res.body.results, "id" ) ).to.contain( 1 );
      }).expect( 200, done );
    } );

    it( "finds observations with fields and values ", done => {
      request( app ).get( "/v1/observations?field:Habitat=marine" ).
      expect( res => {
        expect( _.map( res.body.results, "id" ) ).to.contain( 1 );
      }).expect( 200, done );
    } );

    it( "finds observations with fields and values case-insensitively", done => {
      request( app ).get( "/v1/observations?field:hAbiTat=MaRinE" ).
      expect( res => {
        expect( _.map( res.body.results, "id" ) ).to.contain( 1 );
      }).expect( 200, done );
    } );

    it( "filters by term_id", done => {
      request( app ).get( "/v1/observations?term_id=1" ).
      expect( res => {
        expect( res.body.results.map( r => r.id ) ).to.contain( 7 );
        expect( res.body.results.map( r => r.id ) ).not.to.contain( 6 );
      } ).expect( 200, done );
    } );
    
    it( "filters by term_value_id", done => {
      request( app ).get( "/v1/observations?term_id=1&term_value_id=2" ).
      expect( res => {
        expect( res.body.results.map( r => r.id ) ).to.contain( 8 );
        expect( res.body.results.map( r => r.id ) ).not.to.contain( 7 );
        expect( res.body.results.map( r => r.id ) ).not.to.contain( 6 );
      } ).expect( 200, done );
    } );

    it( "filters by without_term_id", done => {
      request( app ).get( "/v1/observations?without_term_id=1" ).
      expect( res => {
        // not annotated with this term
        expect( res.body.results.map( r => r.id ) ).to.contain( 6 );
        // annotated with this term
        expect( res.body.results.map( r => r.id ) ).not.to.contain( 7 );
        // annotated with this term but failing votes
        expect( res.body.results.map( r => r.id ) ).not.to.contain( 9 );
      } ).expect( 200, done );
    } );

    it( "filters by without_term_value_id", done => {
      request( app ).get( "/v1/observations?term_id=1&without_term_value_id=1" ).
      expect( res => {
        expect( res.body.results.map( r => r.id ) ).to.contain( 8 );
        expect( res.body.results.map( r => r.id ) ).not.to.contain( 7 );
        expect( res.body.results.map( r => r.id ) ).not.to.contain( 6 );
      } ).expect( 200, done );
    } );

  });

  describe( "histogram", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/histogram" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "identifiers", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/identifiers" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "supports pagination", done => {
      request( app ).get( "/v1/observations/identifiers?per_page=1&page=2" ).expect( res => {
        expect( res.body.page ).to.eq( 2 );
        expect( res.body.per_page ).to.eq( 1 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  });

  describe( "observers", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/observers" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "accepts an order_by param", done => {
      request( app ).get( "/v1/observations/observers?order_by=species_count" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "includes user name field", ( ) => {
      request( app ).get( "/v1/observations/observers" ).expect( res => {
        expect( res.results[0].user.name ).to.eq( "A User" );
      });
    });

    it( "supports pagination", done => {
      request( app ).get( "/v1/observations/observers?per_page=1&page=2" ).expect( res => {
        expect( res.body.page ).to.eq( 2 );
        expect( res.body.per_page ).to.eq( 1 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "supports pagination when ordering by species_count", done => {
      request( app ).get( "/v1/observations/observers?per_page=1&page=2&order_by=species_count" ).expect( res => {
        expect( res.body.page ).to.eq( 2 );
        expect( res.body.per_page ).to.eq( 1 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "should never return null total_results", done => {
      request( app ).get( "/v1/observations/observers?place_id=123" ).expect( res => {
        expect( res.body.total_results ).to.eq( 0 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    })
  });

  describe( "species_counts", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/species_counts" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "sorts by count desc by default", done => {
      request( app ).get( "/v1/observations/species_counts" ).expect( res => {
        expect( res.body.results[0].count ).to.eq( 2 );
        expect( res.body.results[1].count ).to.eq( 1 );
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "can sort by count asc", done => {
      request( app ).get( "/v1/observations/species_counts?order=asc" ).expect( res => {
        expect( res.body.results[0].count ).to.eq( 1 );
        expect( res.body.results[1].count ).to.eq( 2 );
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns taxa unobserved by a user", done => {
      request( app ).get( "/v1/observations/species_counts?unobserved_by_user_id=1&lat=50&lng=50" ).
        expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].count ).to.eq( 1 );
          expect( res.body.results[0].taxon.id ).to.eq( 123 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "supports pagination", done => {
      request( app ).get( "/v1/observations/species_counts?per_page=1&page=2" ).expect( res => {
        expect( res.body.page ).to.eq( 2 );
        expect( res.body.per_page ).to.eq( 1 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  });

  describe( "iconic_taxa_counts", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/iconic_taxa_counts" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "iconic_taxa_species_counts", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/iconic_taxa_species_counts" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "updates", ( ) => {
    it( "fails for unauthenticated requests", done => {
      request( app ).get( "/v1/observations/updates" ).expect( res => {
        expect( res.error.text ).to.eq( '{"error":"Unauthorized","status":401}' );
      }).expect( "Content-Type", /json/ ).expect( 401, done );
    });

    it( "allows authenticated requests", done => {
      var token = jwt.sign({ user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates" ).set( "Authorization", token ).expect( res => {
        expect( res.err ).to.be.undefined;
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "shows updates on obs by viewer and not by viewer by default", done => {
      const ownerId = 123;
      var token = jwt.sign({ user_id: ownerId }, config.jwtSecret || "secret", { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates" ).set( "Authorization", token ).expect( res => {
        expect( res.body.results.find( r => r.resource_owner_id === ownerId ) ).to.exist;
        expect( res.body.results.find( r => r.resource_owner_id !== ownerId ) ).to.exist;
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
    it( "filters on obs by viewer", done => {
      const ownerId = 123;
      var token = jwt.sign({ user_id: ownerId }, config.jwtSecret || "secret", { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates?observations_by=owner" ).set( "Authorization", token ).expect( res => {
        expect( res.body.results.find( r => r.resource_owner_id === ownerId ) ).to.exist;
        expect( res.body.results.find( r => r.resource_owner_id !== ownerId ) ).to.not.exist;
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
    it( "filters on obs by following", done => {
      const ownerId = 123;
      var token = jwt.sign({ user_id: ownerId }, config.jwtSecret || "secret", { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates?observations_by=following" ).set( "Authorization", token ).expect( res => {
        expect( res.body.results.find( r => r.resource_owner_id !== ownerId ) ).to.exist;
        expect( res.body.results.find( r => r.resource_owner_id === ownerId ) ).to.not.exist;
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  });

  describe( "deleted", ( ) => {
    it( "fails for unauthenticated requests", done => {
      request( app ).get( "/v1/observations/deleted" ).expect( res => {
        expect( res.error.text ).to.eq( '{"error":"Unauthorized","status":401}' );
      }).expect( "Content-Type", /json/ ).expect( 401, done );
    });

    it( "returns an empty array without a since param", done => {
      var token = jwt.sign({ user_id: 1 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/deleted" ).set( "Authorization", token ).
      expect( res => {
        expect( res.body.total_results ).to.eq( 0 );
        expect( res.body.page ).to.eq( 1 );
        expect( res.body.per_page ).to.eq( 500 );
        expect( res.body.results.length ).to.eq( 0 );
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns observations deleted since date", done => {
      var token = jwt.sign({ user_id: 1 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/deleted?since=2016-01-01" ).set( "Authorization", token ).
      expect( res => {
        expect( res.body.total_results ).to.eq( 3 );
        expect( res.body.results.length ).to.eq( 3 );
      }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

});
