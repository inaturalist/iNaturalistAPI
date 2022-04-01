const { expect } = require( "chai" );
const moment = require( "moment" );
const _ = require( "lodash" );
const request = require( "supertest" );
const nock = require( "nock" );
const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const iNaturalistAPI = require( "../../../lib/inaturalist_api" );
const config = require( "../../../config.js" );

const app = iNaturalistAPI.server( );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Observations", ( ) => {
  describe( "show", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/1" ).expect( res => {
        expect( res.body.results[0].identifications.length ).to.be.above( 0 );
        // unauthenticated users don't get private info
        expect( res.body.results[0].private_location ).to.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "shows authenticated users their own private info", done => {
      const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/1" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "shows authenticated traditional project curators private info if they have access", done => {
      const obsInTradProject = _.find(
        fixtures.elasticsearch.observations.observation,
        o => o.id === 10
      );
      const projectID = obsInTradProject.project_ids[0];
      const curatorProjectUser = _.find(
        fixtures.postgresql.project_users,
        pu => ( pu.project_id === projectID && pu.role === "curator" )
      );
      const token = jwt.sign( { user_id: curatorProjectUser.user_id }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( `/v1/observations/${obsInTradProject.id}` ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    // TODO we really need copies of these tests for authenticated umbrella
    // project curators... but holy crap it's so hard to make test data
    describe( "for authenticated collection project curators", ( ) => {
      const project = _.find( fixtures.elasticsearch.projects.project, p => p.id === 2005 );
      const curatorProjectUser = _.find( fixtures.postgresql.project_users, pu => pu.id === 6 );
      const projectUserTrustingForAny = _.find(
        fixtures.postgresql.project_users,
        pu => pu.id === 7
      );
      const projectUserTrustingForTaxon = _.find(
        fixtures.postgresql.project_users,
        pu => pu.id === 8
      );
      const placeId = _.find( project.search_parameters, sp => sp.field === "place_id" ).value;
      const token = jwt.sign( { user_id: curatorProjectUser.user_id }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      it( "shows authenticated collection project curators private info if observer trusts them with anything", done => {
        const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
          o.private_place_ids
          && o.private_place_ids.includes( placeId )
          && o.user.id === projectUserTrustingForAny.user_id
        ) );
        request( app ).get( `/v1/observations/${obs.id}?include_new_projects=true` ).set( "Authorization", token )
          .expect( res => {
            expect( res.body.results[0].private_location ).to.not.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
      it( "shows authenticated collection project curators private info if observer trusts them with taxon and taxon is threatened", done => {
        const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
          o.private_place_ids
          && o.private_place_ids.includes( placeId )
          && o.user.id === projectUserTrustingForTaxon.user_id
          && ["obscured", "private"].includes( o.taxon_geoprivacy )
          && !["obscured", "private"].includes( o.geoprivacy )
        ) );
        request( app ).get( `/v1/observations/${obs.id}?include_new_projects=true` ).set( "Authorization", token )
          .expect( res => {
            expect( res.body.results[0].private_location ).to.not.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
      it( "does not show authenticated collection project curators private info if observer trusts them with taxon and taxon is threatened and obs has geoprivacy", done => {
        const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
          o.id === 26
        ) );
        expect( obs.geoprivacy ).to.eq( "obscured" );
        expect( obs.taxon_geoprivacy ).to.eq( "obscured" );
        request( app ).get( `/v1/observations/${obs.id}?include_new_projects=true` ).set( "Authorization", token )
          .expect( res => {
            expect( res.body.results[0].private_location ).to.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );

    describe( "for authenticated curators of collection projects with trust disabled", ( ) => {
      const project = _.find( fixtures.elasticsearch.projects.project,
        p => p.id === 2020100101 );
      const curatorProjectUser = _.find( fixtures.postgresql.project_users,
        pu => pu.id === 2020100101 );
      const projectUserTrustingForAny = _.find(
        fixtures.postgresql.project_users,
        pu => pu.id === 2020100102
      );
      const placeId = _.find( project.search_parameters, sp => sp.field === "place_id" ).value;
      const token = jwt.sign( { user_id: curatorProjectUser.user_id }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      it( "does not show private info if observer trusts them with anything", async ( ) => {
        const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
          o.private_place_ids
          && o.private_place_ids.includes( placeId )
          && o.user.id === projectUserTrustingForAny.user_id
        ) );
        return request( app )
          .get( `/v1/observations/${obs.id}?include_new_projects=true` )
          .set( "Authorization", token )
          .expect( 200 )
          .expect( res => {
            expect( res.body.results[0].private_location ).to.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200 );
      } );
    } );

    it( "shows authenticated trusted users private info", done => {
      const token = jwt.sign( { user_id: 125 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/14" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not show authenticated traditional project curators private info if they do not have access", done => {
      const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/11" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not show authenticated users others' private info", done => {
      const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/333" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "localizes taxon names to authenticated users default settings", done => {
      const token = jwt.sign( { user_id: 124 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/4" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].taxon.preferred_common_name ).to.eq( "BestInCaliforniaES" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "shows data if the observer has blocked the viewer", done => {
      const userBlock = fixtures.postgresql.user_blocks[0];
      const blocker = { id: userBlock.user_id };
      const blockee = { id: userBlock.blocked_user_id };
      const token = jwt.sign( { user_id: blockee.id }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      const obs = _.find( fixtures.elasticsearch.observations.observation,
        o => o.user.id === blocker.id );
      request( app ).get( `/v1/observations/${obs.id}` ).set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].uuid ).to.eq( obs.uuid );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "create", ( ) => {
    it( "returns private coordinates when geoprivacy is private", done => {
      const fixtureObs = fixtures.elasticsearch.observations.observation[5];
      expect( fixtureObs.geoprivacy ).to.eq( "private" );
      expect( fixtureObs.location ).to.be.undefined;
      const token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      nock( "http://localhost:3000" )
        .post( "/observations" )
        .reply( 200, [{ id: fixtureObs.id }] );
      request( app ).post( "/v1/observations", {
        // it doesn't really matter what we post since we're just stubbing the
        // Rails app to return obs 6 to load from the ES index
      } ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.private_geojson.coordinates[1] ).to
            .eq( fixtureObs.private_geojson.coordinates[1] );
          expect( res.body.private_location ).not.to.be.undefined;
          expect( res.body.private_location ).to.eq( fixtureObs.private_location );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "works with the Bearer scheme", done => {
      const fixtureObs = fixtures.elasticsearch.observations.observation[5];
      const token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      nock( "http://localhost:3000" )
        .post( "/observations" )
        .reply( 200, [{ id: fixtureObs.id }] );
      request( app ).post( "/v1/observations", {
        // it doesn't really matter what we post since we're just stubbing the
        // Rails app to return obs 6 to load from the ES index
      } ).set( "Authorization", `Bearer ${token}` )
        .expect( res => {
          expect( res.body.id ).to.eq( fixtureObs.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "search", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "looks up observation users from the DB", done => {
      request( app ).get( "/v1/observations" )
        .expect( res => {
          const fixtureObs = _.sortBy(
            fixtures.elasticsearch.observations.observation,
            o => ( o.created_at ? moment( o.created_at ) : moment( "0000-01-01" ) )
          ).reverse( );
          const dbUsers = fixtures.postgresql.users;
          expect( res.body.total_results ).to.eq( fixtureObs.length );
          expect( res.body.results[0].id ).to.eq( fixtureObs[0].id );
          expect( res.body.results[0].user.id ).to.eq( fixtureObs[0].user.id );
          const dbUser0 = _.find( dbUsers, u => u.id === fixtureObs[0].user.id );
          const dbUser1 = _.find( dbUsers, u => u.id === fixtureObs[1].user.id );
          expect( res.body.results[0].user.login ).to.eq( dbUser0.login );
          expect( res.body.results[1].id ).to.eq( fixtureObs[1].id );
          expect( res.body.results[1].user.id ).to.eq( fixtureObs[1].user.id );
          // login comes from the DB
          expect( res.body.results[1].user.login ).to.eq( dbUser1.login );
          expect( res.body.results[1].user.name ).to.eq( dbUser1.name );
        } ).expect( 200, done );
    } );

    it( "finds observations by user login", done => {
      request( app ).get( "/v1/observations?user_id=a-user" )
        .expect( res => {
          expect( res.body.total_results ).not.to.eq( 0 );
          _.forEach( res.body.results, obs => {
            expect( obs.user.login ).to.eq( "a-user" );
          } );
        } ).expect( 200, done );
    } );

    it( "finds observations by user_id", done => {
      request( app ).get( "/v1/observations?user_id=123" )
        .expect( res => {
          expect( res.body.total_results ).not.to.eq( 0 );
          _.forEach( res.body.results, obs => {
            expect( obs.user.id ).to.eq( 123 );
          } );
        } ).expect( 200, done );
    } );

    it( "finds observations by not_user_id", done => {
      const taxonId = 1;
      const fixtureObs = _.filter(
        fixtures.elasticsearch.observations.observation,
        o => o.taxon && o.taxon.ancestor_ids.includes( taxonId )
      );
      const fixtureObsUserIds = fixtureObs.map( o => o.user.id );
      const notUserId = fixtureObsUserIds[0];
      expect( fixtureObsUserIds.length ).to.be.above( 1 );
      request( app )
        .get( `/v1/observations?taxon_id=${taxonId}&not_user_id=${notUserId}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.map( o => o.user.id ) ).not.to.include( notUserId );
        } )
        .expect( 200, done );
    } );
    it( "finds observations when not_user_id is a login", done => {
      const taxonId = 1;
      const fixtureObs = _.filter(
        fixtures.elasticsearch.observations.observation,
        o => o.taxon && o.taxon.ancestor_ids.includes( taxonId )
      );
      const fixtureObsUserLogins = fixtureObs.map( o => o.user.login );
      const notUserLogin = fixtureObsUserLogins[0];
      expect( fixtureObsUserLogins.length ).to.be.above( 1 );
      request( app )
        .get( `/v1/observations?taxon_id=${taxonId}&not_user_id=${notUserLogin}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.map( o => o.user.notUserLogin ) ).not.to.include( notUserLogin );
        } )
        .expect( 200, done );
    } );

    it( "finds observations by taxon_id", done => {
      request( app ).get( "/v1/observations?taxon_id=4" )
        .expect( res => {
          expect( _.map( res.body.results, "id" ) ).to.contain( 1 );
        } ).expect( 200, done );
    } );

    it( "finds observations by without_taxon_id", done => {
      request( app ).get( "/v1/observations?taxon_id=4&without_taxon_id=5" )
        .expect( res => {
          expect( _.map( res.body.results, "id" ) ).to.contain( 2 );
          expect( _.map( res.body.results, "id" ) ).not.to.contain( 1 );
        } ).expect( 200, done );
    } );

    it( "finds observations by multiple without_taxon_id", done => {
      request( app ).get( "/v1/observations?without_taxon_id=4,5" )
        .expect( res => {
          expect( _.map( res.body.results, "id" ) ).to.contain( 333 );
          expect( _.map( res.body.results, "id" ) ).not.to.contain( 2 );
          expect( _.map( res.body.results, "id" ) ).not.to.contain( 1 );
        } ).expect( 200, done );
    } );

    it( "finds observations by ident_user_id", done => {
      const userID = 121;
      request( app ).get( `/v1/observations?ident_user_id=${userID}` )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
          const obsIdentifiedByUser = _.filter( res.body.results,
            o => _.find( o.identifications, i => i.user.id === userID ) );
          expect( obsIdentifiedByUser.length ).to.eq( res.body.results.length );
        } ).expect( 200, done );
    } );

    it( "finds observations by ident_user_id by login", done => {
      const login = "user121";
      request( app ).get( `/v1/observations?ident_user_id=${login}` )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
          const obsIdentifiedByUser = _.filter( res.body.results,
            o => _.find( o.identifications, i => i.user.login === login ) );
          expect( obsIdentifiedByUser.length ).to.eq( res.body.results.length );
        } ).expect( 200, done );
    } );

    it( "finds observations by numerous ident_user_id", done => {
      const userIDs = [121, 122];
      request( app ).get( `/v1/observations?ident_user_id=${userIDs.join( "," )}` )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
          const obsIdentifiedByUsers = _.filter( res.body.results,
            o => _.find( o.identifications, i => userIDs.indexOf( i.user.id ) >= 0 ) );
          expect( obsIdentifiedByUsers.length ).to.eq( res.body.results.length );
          const obsIdentifiedByNeither = _.filter( res.body.results,
            o => _.find( o.identifications, i => userIDs.indexOf( i.user.id ) < 0 ) );
          expect( obsIdentifiedByNeither.length ).to.eq( 0 );
        } ).expect( 200, done );
    } );

    it( "finds observations by without_ident_user_id", done => {
      const userID = 121;
      request( app ).get( `/v1/observations?without_ident_user_id=${userID}` )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
          const obsIdentifiedByUser = _.filter( res.body.results,
            o => _.find( o.identifications, i => i.user.id === userID ) );
          expect( obsIdentifiedByUser.length ).to.eq( 0 );
        } ).expect( 200, done );
    } );

    it( "looks up projects by slug", done => {
      request( app ).get( "/v1/observations?projects=a-project" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
        } ).expect( 200, done );
    } );

    it( "looks up not_in_project by slug", done => {
      request( app ).get( "/v1/observations?not_in_project=a-project" )
        .expect( res => {
          expect( res.body.total_results )
            .to.eq( fixtures.elasticsearch.observations.observation.length - 1 );
        } ).expect( 200, done );
    } );

    it( "looks up multiple projects", done => {
      request( app ).get( "/v1/observations?projects[]=nonsense&projects[]=a-project" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
        } ).expect( 200, done );
    } );

    it( "ignores missing projects", done => {
      request( app ).get( "/v1/observations?projects=nonsense" )
        .expect( res => {
          expect( res.body.total_results )
            .to.eq( fixtures.elasticsearch.observations.observation.length );
        } ).expect( 200, done );
    } );

    it( "return iconic taxon names", done => {
      request( app ).get( "/v1/observations?id=1" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].taxon.iconic_taxon_id ).to.eq( 101 );
          expect( res.body.results[0].taxon.iconic_taxon_name ).to.eq( "Actinopterygii" );
        } ).expect( 200, done );
    } );

    it( "does not strips place guess from obscured observations", done => {
      request( app ).get( "/v1/observations?geoprivacy=obscured_private" )
        .expect( res => {
          const o = _.find( res.body.results, r => r.id === 333 );
          expect( o.place_guess ).to.eq( "Idaho" );
        } ).expect( 200, done );
    } );

    it( "filters by sounds", done => {
      request( app ).get( "/v1/observations?sounds=true" )
        .expect( res => {
          expect( res.body.results.length ).to.eq( 1 );
        } ).expect( 200, done );
    } );

    it( "filters by captive", done => {
      request( app ).get( "/v1/observations?captive=true&id=1,5" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ).indexOf( 5 ) ).to.not.be.undefined; // captive
          expect( res.body.results.map( r => r.id ).indexOf( 1 ) ).to.eq( -1 ); // not-captive
        } ).expect( 200, done );
    } );

    it( "filters by not captive", done => {
      request( app ).get( "/v1/observations?captive=false&id=1,5" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ).indexOf( 5 ) ).to.eq( -1 ); // captive
          expect( res.body.results.map( r => r.id ).indexOf( 1 ) )
            .to.not.be.undefined; // not-captive
        } ).expect( 200, done );
    } );

    it( "filters by captive=any", done => {
      request( app ).get( "/v1/observations?captive=any&id=1,5" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ).indexOf( 5 ) ).to.not.be.undefined; // captive
          expect( res.body.results.map( r => r.id ).indexOf( 1 ) )
            .to.not.be.undefined; // not-captive
        } ).expect( 200, done );
    } );

    it( "filters by licensed", done => {
      request( app ).get( "/v1/observations?licensed=true&id=1,5" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ).includes( 1 ) ).to.be.true; // licensed
          expect( res.body.results.map( r => r.id ).includes( 5 ) ).to.be.false; // not licensed
        } ).expect( 200, done );
    } );

    it( "filters by not licensed", done => {
      request( app ).get( "/v1/observations?licensed=false&id=1,5" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ).includes( 1 ) ).to.be.false; // licensed
          expect( res.body.results.map( r => r.id ).includes( 5 ) ).to.be.true; // not licensed
        } ).expect( 200, done );
    } );

    it( "filters by photo_licensed", done => {
      request( app ).get( "/v1/observations?photo_licensed=true&photos=true" )
        .expect( res => {
          expect( res.body.results ).not.to.be.empty;
          _.forEach( res.body.results, obs => {
            expect( obs.photos ).not.to.be.empty;
            _.forEach( obs.photos, photo => {
              // Everything should begin with cc
              expect( photo.license_code ).to.match( /^cc/ );
            } );
          } );
        } ).expect( 200, done );
    } );

    it( "filters by not photo_licensed", done => {
      request( app ).get( "/v1/observations?photo_licensed=false&photos=true" )
        .expect( res => {
          expect( res.body.results ).not.to.be.empty;
          // The fixtures should have at least one obs that has an unlicensed
          // photo
          expect(
            _.filter( res.body.results, obs => ( obs.photos && obs.photos.length > 0 ) )
          ).not.to.be.empty;
          _.forEach( res.body.results, obs => {
            _.forEach( obs.photos, photo => {
              // Everything should have no license
              expect( photo.license_code ).to.be.null;
            } );
          } );
        } ).expect( 200, done );
    } );

    it( "filter by photos=true", done => {
      request( app ).get( "/v1/observations?photos=true" )
        .expect( res => {
          expect( res.body.results[0].photos[0] ).to.not.be.undefined;
        } ).expect( 200, done );
    } );

    it( "includes soundcloud identifiers", done => {
      request( app ).get( "/v1/observations?sounds=true" )
        .expect( res => {
          expect( res.body.results[0].sounds[0].native_sound_id ).to.not.be.undefined;
        } ).expect( 200, done );
    } );

    it( "can return full details on searches", done => {
      request( app ).get( "/v1/observations?id=1&details=all" )
        .expect( res => {
          expect( res.body.results[0].identifications.length ).to.be.above( 0 );
          expect( res.body.results[0].project_observations.length ).to.be.above( 0 );
          expect( res.body.results[0].project_observations[0].project.location ).to.eq( "22,33" );
          expect( res.body.results[0].project_observations[0].project.latitude ).to.eq( "22" );
          expect( res.body.results[0].project_observations[0].project.longitude ).to.eq( "33" );
        } ).expect( 200, done );
    } );

    it( "returns a bounding box if you request one", done => {
      request( app ).get( "/v1/observations?return_bounds=true" )
        .expect( res => {
          expect( res.body.total_bounds ).to.not.be.undefined;
          expect( res.body.total_bounds.swlng ).to.not.be.undefined;
        } ).expect( 200, done );
    } );

    it( "doesn't return a bounding box if you don't request one", done => {
      request( app ).get( "/v1/observations" )
        .expect( res => {
          expect( res.body.total_bounds ).to.be.undefined;
        } ).expect( 200, done );
    } );

    it( "doesn't return a bounding box if there are no observations", done => {
      request( app ).get( "/v1/observations?user_id=9999" )
        .expect( res => {
          expect( res.body.total_bounds ).to.be.undefined;
        } ).expect( 200, done );
    } );

    it( "finds observations with fields", done => {
      request( app ).get( "/v1/observations?field:Habitat" )
        .expect( res => {
          expect( _.map( res.body.results, "id" ) ).to.contain( 1 );
        } ).expect( 200, done );
    } );

    it( "finds observations with fields and values ", done => {
      request( app ).get( "/v1/observations?field:Habitat=marine" )
        .expect( res => {
          expect( _.map( res.body.results, "id" ) ).to.contain( 1 );
        } ).expect( 200, done );
    } );

    it( "finds observations with fields and values case-insensitively", done => {
      request( app ).get( "/v1/observations?field:hAbiTat=MaRinE" )
        .expect( res => {
          expect( _.map( res.body.results, "id" ) ).to.contain( 1 );
        } ).expect( 200, done );
    } );

    describe( "ofv_datatype", ( ) => {
      const obsWithNumericField = 22;
      const obsWithTaxonField = 23;
      const obsWithNoFields = 2;
      it( "should filter by a single type", done => {
        request( app ).get( "/v1/observations?ofv_datatype=taxon" )
          .expect( res => {
            expect( res.body.results.map( r => r.id ) ).to.contain( obsWithTaxonField );
            expect( res.body.results.map( r => r.id ) ).not.to.contain( obsWithNumericField );
            expect( res.body.results.map( r => r.id ) ).not.to.contain( obsWithNoFields );
          } ).expect( 200, done );
      } );
      it( "should filter by multiple types", done => {
        request( app ).get( "/v1/observations?ofv_datatype=taxon,numeric" )
          .expect( res => {
            expect( res.body.results.map( r => r.id ) ).to.contain( obsWithTaxonField );
            expect( res.body.results.map( r => r.id ) ).to.contain( obsWithNumericField );
            expect( res.body.results.map( r => r.id ) ).not.to.contain( obsWithNoFields );
          } ).expect( 200, done );
      } );
    } );

    it( "filters by term_id", done => {
      request( app ).get( "/v1/observations?term_id=1" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ) ).to.contain( 7 );
          expect( res.body.results.map( r => r.id ) ).not.to.contain( 6 );
        } ).expect( 200, done );
    } );

    it( "filters by term_value_id", done => {
      request( app ).get( "/v1/observations?term_id=1&term_value_id=2" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ) ).to.contain( 8 );
          expect( res.body.results.map( r => r.id ) ).not.to.contain( 7 );
          expect( res.body.results.map( r => r.id ) ).not.to.contain( 6 );
        } ).expect( 200, done );
    } );

    it( "filters by without_term_id", done => {
      request( app ).get( "/v1/observations?without_term_id=1&id=6,7,9" )
        .expect( res => {
          // not annotated with this term
          expect( res.body.results.map( r => r.id ) ).to.contain( 6 );
          // annotated with this term
          expect( res.body.results.map( r => r.id ) ).not.to.contain( 7 );
          // annotated with this term but failing votes
          expect( res.body.results.map( r => r.id ) ).not.to.contain( 9 );
        } ).expect( 200, done );
    } );

    it( "filters by term_id and without_term_id", done => {
      const hasTerm1 = 9;
      const hasTerm2 = 20;
      const hasTerm1And2 = 21;
      request( app ).get(
        `/v1/observations?term_id=2&without_term_id=1&id=${[hasTerm1, hasTerm2, hasTerm1And2].join( "," )}`
      ).expect( res => {
        expect( res.body.results.map( r => r.id ) ).to.contain( hasTerm2 );
        expect( res.body.results.map( r => r.id ) ).not.to.contain( hasTerm1 );
        expect( res.body.results.map( r => r.id ) ).not.to.contain( hasTerm1And2 );
      } ).expect( 200, done );
    } );

    it( "filters by without_term_value_id", done => {
      request( app ).get( "/v1/observations?term_id=1&without_term_value_id=1" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ) ).to.contain( 8 );
          expect( res.body.results.map( r => r.id ) ).not.to.contain( 7 );
          expect( res.body.results.map( r => r.id ) ).not.to.contain( 6 );
        } ).expect( 200, done );
    } );

    it( "can return only ids", done => {
      request( app ).get( "/v1/observations?id=2&only_id=true&per_page=1" )
        .expect( res => {
          const result = res.body.results[0];
          expect( _.keys( result ).length ).to.eq( 1 );
          expect( _.keys( result )[0] ).to.eq( "id" );
          expect( result.id ).to.eq( 2 );
        } ).expect( 200, done );
    } );

    it( "filters by geoprivacy", done => {
      const obsWithUserGeoprivacy = 333;
      const obsWithTaxonGeoprivacy = 15;
      const obsWithUserAndTaxonGeoprivacy = 16;
      request( app ).get( "/v1/observations?geoprivacy=obscured" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ) ).to.contain( obsWithUserGeoprivacy );
          expect( res.body.results.map( r => r.id ) ).not.to.contain( obsWithTaxonGeoprivacy );
          expect( res.body.results.map( r => r.id ) ).to.contain( obsWithUserAndTaxonGeoprivacy );
        } ).expect( 200, done );
    } );
    it( "filters by taxon_geoprivacy", done => {
      const obsWithUserGeoprivacy = 333;
      const obsWithTaxonGeoprivacy = 15;
      const obsWithUserAndTaxonGeoprivacy = 16;
      request( app ).get( "/v1/observations?taxon_geoprivacy=obscured" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ) ).to.contain( obsWithTaxonGeoprivacy );
          expect( res.body.results.map( r => r.id ) ).not.to.contain( obsWithUserGeoprivacy );
          expect( res.body.results.map( r => r.id ) ).to.contain( obsWithUserAndTaxonGeoprivacy );
        } ).expect( 200, done );
    } );
    it( "filters by geoprivacy and taxon_geoprivacy", done => {
      const obsWithUserGeoprivacy = 333;
      const obsWithTaxonGeoprivacy = 15;
      const obsWithUserAndTaxonGeoprivacy = 16;
      request( app ).get( "/v1/observations?geoprivacy=obscured&taxon_geoprivacy=obscured" )
        .expect( res => {
          expect( res.body.results.map( r => r.id ) ).not.to.contain( obsWithTaxonGeoprivacy );
          expect( res.body.results.map( r => r.id ) ).not.to.contain( obsWithUserGeoprivacy );
          expect( res.body.results.map( r => r.id ) ).to.contain( obsWithUserAndTaxonGeoprivacy );
        } ).expect( 200, done );
    } );
    it( "filters by acc_below", done => {
      const obsWithPositionalAccuracy5000 = 17;
      const obsWithPositionalAccuracy5 = 18;
      const obsWithUnknownPositionalAccuracy = 19;
      request( app ).get( "/v1/observations?acc_below=100" )
        .expect( res => {
          const ids = res.body.results.map( r => r.id );
          expect( ids ).to.contain( obsWithPositionalAccuracy5 );
          expect( ids ).not.to.contain( obsWithPositionalAccuracy5000 );
          expect( ids ).not.to.contain( obsWithUnknownPositionalAccuracy );
        } ).expect( 200, done );
    } );
    it( "filters by acc_below_or_unknown", done => {
      const obsWithPositionalAccuracy5000 = 17;
      const obsWithPositionalAccuracy5 = 18;
      const obsWithUnknownPositionalAccuracy = 19;
      // Limiting request to observations 17, 18, and 19 to avoid returning many other
      // observations with unknown accuracies.
      request( app ).get( "/v1/observations?acc_below_or_unknown=100&id_above=16&id_below=20" )
        .expect( res => {
          const ids = res.body.results.map( r => r.id );
          expect( ids ).to.contain( obsWithPositionalAccuracy5 );
          expect( ids ).to.contain( obsWithUnknownPositionalAccuracy );
          expect( ids ).not.to.contain( obsWithPositionalAccuracy5000 );
        } ).expect( 200, done );
    } );
    it( "filters by acc_above", done => {
      const obsWithPositionalAccuracy5000 = 17;
      const obsWithPositionalAccuracy5 = 18;
      request( app ).get( "/v1/observations?acc_above=100" )
        .expect( res => {
          const ids = res.body.results.map( r => r.id );
          expect( ids ).not.to.contain( obsWithPositionalAccuracy5 );
          expect( ids ).to.contain( obsWithPositionalAccuracy5000 );
        } ).expect( 200, done );
    } );
    it( "filters by acc=true", done => {
      const obsWithPositionalAccuracy5000 = 17;
      const obsWithPositionalAccuracy5 = 18;
      const obsWithNoPositionalAccuracy = 19;
      request( app ).get( "/v1/observations?acc=true" )
        .expect( res => {
          const ids = res.body.results.map( r => r.id );
          expect( ids ).to.contain( obsWithPositionalAccuracy5 );
          expect( ids ).to.contain( obsWithPositionalAccuracy5000 );
          expect( ids ).not.to.contain( obsWithNoPositionalAccuracy );
        } ).expect( 200, done );
    } );
    it( "filters by acc=false", done => {
      const obsWithPositionalAccuracy5000 = 17;
      const obsWithPositionalAccuracy5 = 18;
      const obsWithNoPositionalAccuracy = 19;
      const requestIds = [
        obsWithPositionalAccuracy5000,
        obsWithPositionalAccuracy5,
        obsWithNoPositionalAccuracy
      ];
      request( app ).get( `/v1/observations?id=${requestIds.join( "," )}&acc=false` )
        .expect( res => {
          const ids = res.body.results.map( r => r.id );
          expect( ids ).not.to.contain( obsWithPositionalAccuracy5 );
          expect( ids ).not.to.contain( obsWithPositionalAccuracy5000 );
          expect( ids ).to.contain( obsWithNoPositionalAccuracy );
        } ).expect( 200, done );
    } );
    describe( "viewed by project curator", ( ) => {
      const curatorProjectUser = _.find( fixtures.postgresql.project_users, pu => pu.id === 6 );
      const token = jwt.sign( { user_id: curatorProjectUser.user_id }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      it( "only includes non_traditional_projects when filtered by project_id for relevant projects", done => {
        const includedProject = _.find(
          fixtures.elasticsearch.projects.project, p => p.id === 2005
        );
        const excludedProject = _.find(
          fixtures.elasticsearch.projects.project, p => p.id === 2001
        );
        const includedObs = _.find(
          fixtures.elasticsearch.observations.observation,
          o => o.uuid === "ca81b849-a052-4b12-9755-7c5d49190fb3"
        );
        request( app )
          .get(
            `/v1/observations?include_new_projects=true&project_id=${includedProject.id},${excludedProject.id}`
          )
          .set( "Authorization", token )
          .expect( 200 )
          .expect( res => {
            const ids = res.body.results.map( r => r.id );
            expect( ids ).to.contain( includedObs.id );
            const resObs = _.find( res.body.results, r => r.uuid === includedObs.uuid );
            // The obs is *supposed* to be in the includedProject, which should be
            // a collection / non-traditional project
            expect( resObs.non_traditional_projects ).not.to.be.undefined;
            const nonTradIds = _.map( resObs.non_traditional_projects, "project_id" );
            expect( nonTradIds ).to.contain( includedProject.id );
            expect( nonTradIds ).not.to.contain( excludedProject.id );
          } )
          .expect( 200, done );
      } );
      describe( "filtering by a collection project they curate", ( ) => {
        const project = _.find( fixtures.elasticsearch.projects.project, p => p.id === 2005 );
        const placeId = _.find( project.search_parameters, sp => sp.field === "place_id" ).value;
        it( "should include hidden coords for obs by members who trust them with obs of anything", done => {
          const projectUserTrustingForAny = _.find(
            fixtures.postgresql.project_users,
            pu => pu.id === 7
          );
          // Note that this obs should only appear to be in the project by
          // people who have permission to see the hidden coordinates, b/c its
          // private coordinates are inside the project place oundary, but its
          // public coordinates are outside
          const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
            o.private_place_ids
            && o.private_place_ids.includes( placeId )
            && !o.place_ids.includes( placeId )
            && o.user.id === projectUserTrustingForAny.user_id
          ) );
          expect( obs ).to.not.be.undefined;
          request( app ).get( `/v1/observations?project_id=${project.id}` )
            .set( "Authorization", token )
            .expect( res => {
              const resultObs = _.find( res.body.results, o => o.id === obs.id );
              // Failure here means the target observation wasn't even included
              // in the search results
              expect( resultObs ).to.not.be.undefined;
              // Failure here means the observation was included but the viewer
              // couldn't see the private location
              expect( resultObs.private_location ).to.not.be.undefined;
            } )
            .expect( "Content-Type", /json/ )
            .expect( 200, done );
        } );
        describe( "by members who trust them with obs of threatened taxa", ( ) => {
          const projectUserTrustingForTaxon = _.find(
            fixtures.postgresql.project_users,
            pu => pu.id === 8
          );
          it( "should include hidden coords for obs obscured by threatened taxa", done => {
            const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
              o.private_place_ids
              && o.private_place_ids.includes( placeId )
              && !o.place_ids.includes( placeId )
              && o.user.id === projectUserTrustingForTaxon.user_id
              && o.taxon_geoprivacy === "obscured"
              && !o.geoprivacy
            ) );
            request( app ).get( `/v1/observations?project_id=${project.id}` ).set( "Authorization", token )
              .expect( res => {
                const resultObs = _.find( res.body.results, o => o.id === obs.id );
                expect( resultObs.private_location ).to.not.be.undefined;
              } )
              .expect( "Content-Type", /json/ )
              .expect( 200, done );
          } );
          it( "should not include an obs with public coords outside the place and private coords inside the place that is obscured by geoprivacy", done => {
            const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
              o.private_place_ids
              && o.private_place_ids.includes( placeId )
              && !o.place_ids.includes( placeId )
              && o.user.id === projectUserTrustingForTaxon.user_id
              && !o.taxon_geoprivacy
              && o.geoprivacy
            ) );
            request( app ).get( `/v1/observations?project_id=${project.id}` ).set( "Authorization", token )
              .expect( res => {
                expect( _.map( res.body.results, o => o.id ) ).not.to.include( obs.id );
              } )
              .expect( "Content-Type", /json/ )
              .expect( 200, done );
          } );
          it( "should not include an obs with public coords outside the place and private coords inside the place that is obscured by geoprivacy and threatened taxon", done => {
            const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
              o.private_place_ids
              && o.private_place_ids.includes( placeId )
              && !o.place_ids.includes( placeId )
              && o.user.id === projectUserTrustingForTaxon.user_id
              && o.taxon_geoprivacy
              && o.geoprivacy
            ) );
            request( app ).get( `/v1/observations?project_id=${project.id}` ).set( "Authorization", token )
              .expect( res => {
                expect( _.map( res.body.results, o => o.id ) ).not.to.include( obs.id );
              } )
              .expect( "Content-Type", /json/ )
              .expect( 200, done );
          } );
        } );
      } );
      it( "should not include hidden coords for an obs in a collection project they do not curate", done => {
        const project = _.find( fixtures.elasticsearch.projects.project, p => p.id === 2006 );
        const placeId = _.find( project.search_parameters, sp => sp.field === "place_id" ).value;
        const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
          o.private_place_ids
          && o.private_place_ids.includes( placeId )
          && o.place_ids.includes( placeId )
          && o.geoprivacy === "obscured"
        ) );
        request( app ).get( `/v1/observations?project_id=${project.id}` ).set( "Authorization", token )
          .expect( res => {
            const resultObs = _.find( res.body.results, o => o.id === obs.id );
            expect( resultObs.private_location ).to.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
      describe( "coords_viewable_for_proj", ( ) => {
        const curatedProject = _.find(
          fixtures.elasticsearch.projects.project,
          p => p.id === curatorProjectUser.project_id
        );
        it( "should include obscured obs by people who trust the viewer", done => {
          const obsByUserWhoTrustsCurator = _.find(
            fixtures.elasticsearch.observations.observation,
            o => o.id === 32
          );
          request( app ).get( `/v1/observations?project_id=${curatedProject.id}&coords_viewable_for_proj=true` )
            .set( "Authorization", token )
            .expect( res => {
              expect( _.map( res.body.results, "id" ) ).to.include( obsByUserWhoTrustsCurator.id );
            } )
            .expect( "Content-Type", /json/ )
            .expect( 200, done );
        } );
        it( "should not include obscured obs by people who do not trust the viewer", done => {
          const obsByUserWhoDoesNotTrustsCurator = _.find(
            fixtures.elasticsearch.observations.observation,
            o => o.id === 33
          );
          request( app ).get( `/v1/observations?project_id=${curatedProject.id}&coords_viewable_for_proj=true` )
            .set( "Authorization", token )
            .expect( res => {
              expect( _.map( res.body.results, "id" ) ).not.to.include( obsByUserWhoDoesNotTrustsCurator.id );
            } )
            .expect( "Content-Type", /json/ )
            .expect( 200, done );
        } );
        it( "should include unobscured obs by people who do not trust the viewer", done => {
          const obsByUserWhoDoesNotTrustsCurator = _.find(
            fixtures.elasticsearch.observations.observation,
            o => o.id === 34
          );
          request( app ).get( `/v1/observations?project_id=${curatedProject.id}&coords_viewable_for_proj=true` )
            .set( "Authorization", token )
            .expect( res => {
              expect( _.map( res.body.results, "id" ) ).to.include( obsByUserWhoDoesNotTrustsCurator.id );
            } )
            .expect( "Content-Type", /json/ )
            .expect( 200, done );
        } );
        it( "should not include obs without open geoprivacy", done => {
          const obs = _.find(
            fixtures.elasticsearch.observations.observation,
            o => o.id === 30
          );
          request( app ).get( `/v1/observations?project_id=${curatedProject.id}&coords_viewable_for_proj=true` )
            .set( "Authorization", token )
            .expect( res => {
              expect( _.map( res.body.results, "id" ) ).not.to.include( obs.id );
            } )
            .expect( "Content-Type", /json/ )
            .expect( 200, done );
        } );
        it( "should not include obs without open taxon geoprivacy", done => {
          const obs = _.find(
            fixtures.elasticsearch.observations.observation,
            o => o.id === 35
          );
          request( app ).get( `/v1/observations?project_id=${curatedProject.id}&coords_viewable_for_proj=true` )
            .set( "Authorization", token )
            .expect( res => {
              expect( _.map( res.body.results, "id" ) ).not.to.include( obs.id );
            } )
            .expect( "Content-Type", /json/ )
            .expect( 200, done );
        } );
        it( "should include obs with geoprivacy when observer trusts a project the viewer curates with anything", done => {
          const obs = _.find(
            fixtures.elasticsearch.observations.observation,
            o => o.id === 28
          );
          request( app ).get( `/v1/observations?project_id=${curatedProject.id}&coords_viewable_for_proj=true` )
            .set( "Authorization", token )
            .expect( res => {
              expect( _.map( res.body.results, "id" ) ).to.include( obs.id );
            } )
            .expect( "Content-Type", /json/ )
            .expect( 200, done );
        } );
        it( "should not include obs with geoprivacy when observer trusts a project the viewer curates with taxa", done => {
          const obs = _.find(
            fixtures.elasticsearch.observations.observation,
            o => o.id === 26
          );
          expect( obs.geoprivacy ).to.eq( "obscured" );
          request( app ).get( `/v1/observations?project_id=${curatedProject.id}&coords_viewable_for_proj=true` )
            .set( "Authorization", token )
            .expect( res => {
              expect( _.map( res.body.results, "id" ) ).not.to.include( obs.id );
            } )
            .expect( "Content-Type", /json/ )
            .expect( 200, done );
        } );
        it( "should include obs with taxon geoprivacy when observer trusts a project the viewer curates with taxa", done => {
          const obs = _.find(
            fixtures.elasticsearch.observations.observation,
            o => o.id === 25
          );
          expect( obs.taxon_geoprivacy ).to.eq( "obscured" );
          expect( obs.geoprivacy ).to.be.undefined;
          request( app ).get( `/v1/observations?project_id=${curatedProject.id}&coords_viewable_for_proj=true` )
            .set( "Authorization", token )
            .expect( res => {
              expect( _.map( res.body.results, "id" ) ).to.include( obs.id );
            } )
            .expect( "Content-Type", /json/ )
            .expect( 200, done );
        } );
        it( "should not include obs with geoprivacy when observer trusts a project with trust disabled that the viewer curates", done => {
          const proj = _.find(
            fixtures.elasticsearch.projects.project,
            p => p.id === 2020100101
          );
          const tok = jwt.sign( { user_id: proj.user_id }, config.jwtSecret || "secret",
            { algorithm: "HS512" } );
          const obs = _.find(
            fixtures.elasticsearch.observations.observation,
            p => p.id === 2020100101
          );
          request( app ).get( `/v1/observations?project_id=${proj.id}&coords_viewable_for_proj=true` )
            .set( "Authorization", tok )
            .expect( res => {
              expect( _.map( res.body.results, "id" ) ).not.to.include( obs.id );
            } )
            .expect( "Content-Type", /json/ )
            .expect( 200, done );
        } );
      } );
    } );
    describe( "viewed by project curator filtering by a collection project they curate with user trust disabled", ( ) => {
      const curatorProjectUser = _.find( fixtures.postgresql.project_users,
        pu => pu.id === 2020100101 );
      const token = jwt.sign( { user_id: curatorProjectUser.user_id }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      const project = _.find( fixtures.elasticsearch.projects.project,
        p => p.id === curatorProjectUser.project_id );
      it( "should not include hidden coords for obs by members who trust them with obs of anything", done => {
        const projectUserTrustingForAny = _.find(
          fixtures.postgresql.project_users,
          pu => pu.id === 2020100102
        );
        request( app ).get( `/v1/observations?project_id=${project.id}&user_id=${projectUserTrustingForAny.user_id}` )
          .set( "Authorization", token )
          .expect( res => {
            const resultObs = _.find( res.body.results, o => o.geoprivacy === "obscured" );
            expect( resultObs.private_location ).to.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );
    describe( "viewed by trusting member of project", ( ) => {
      const project = _.find( fixtures.elasticsearch.projects.project, p => p.id === 2005 );
      const placeId = _.find( project.search_parameters, sp => sp.field === "place_id" ).value;
      const projectUserTrustingForAny = _.find(
        fixtures.postgresql.project_users,
        pu => pu.id === 7
      );
      const token = jwt.sign(
        { user_id: projectUserTrustingForAny.user_id },
        config.jwtSecret || "secret",
        { algorithm: "HS512" }
      );
      it( "should include an observation by the viewer that is privately inside the place but publicly outside", done => {
        const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
          o.private_place_ids
          && o.private_place_ids.includes( placeId )
          && !o.place_ids.includes( placeId )
          && o.user.id === projectUserTrustingForAny.user_id
        ) );
        expect( obs ).to.not.be.undefined;
        request( app ).get( `/v1/observations?project_id=${project.id}` )
          .set( "Authorization", token )
          .expect( res => {
            const resultObs = _.find( res.body.results, o => o.id === obs.id );
            // Failure here means the target observation wasn't even included
            // in the search results
            expect( resultObs ).to.not.be.undefined;
            // Failure here means the observation was included but the viewer
            // couldn't see the private location
            expect( resultObs.private_location ).to.not.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
      it( "should not include an observation by someone else that is privately inside the place but publicly outside", done => {
        const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
          o.private_place_ids
          && o.private_place_ids.includes( placeId )
          && !o.place_ids.includes( placeId )
          && o.user.id !== projectUserTrustingForAny.user_id
        ) );
        expect( obs ).to.not.be.undefined;
        request( app ).get( `/v1/observations?project_id=${project.id}` )
          .set( "Authorization", token )
          .expect( res => {
            const resultObs = _.find( res.body.results, o => o.id === obs.id );
            expect( resultObs ).to.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );
    describe( "viewed by non-trusting member of project", ( ) => {
      const project = _.find( fixtures.elasticsearch.projects.project, p => p.id === 2005 );
      const placeId = _.find( project.search_parameters, sp => sp.field === "place_id" ).value;
      const projectUserTrustingForNone = _.find(
        fixtures.postgresql.project_users,
        pu => pu.id === 9
      );
      const token = jwt.sign(
        { user_id: projectUserTrustingForNone.user_id },
        config.jwtSecret || "secret",
        { algorithm: "HS512" }
      );
      it( "should not include an observation by the viewer that is privately inside the place but publicly outside", done => {
        const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
          o.private_place_ids
          && o.private_place_ids.includes( placeId )
          && !o.place_ids.includes( placeId )
          && o.user.id === projectUserTrustingForNone.user_id
        ) );
        expect( obs ).to.not.be.undefined;
        request( app ).get( `/v1/observations?project_id=${project.id}` )
          .set( "Authorization", token )
          .expect( res => {
            const resultObs = _.find( res.body.results, o => o.id === obs.id );
            expect( resultObs ).to.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );
    describe( "viewed by non-member of project", ( ) => {
      const project = _.find( fixtures.elasticsearch.projects.project, p => p.id === 2005 );
      const placeId = _.find( project.search_parameters, sp => sp.field === "place_id" ).value;
      const nonMemberUser = _.find(
        fixtures.elasticsearch.users.user,
        u => u.id === 2
      );
      const token = jwt.sign(
        { user_id: nonMemberUser.id },
        config.jwtSecret || "secret",
        { algorithm: "HS512" }
      );
      it( "should not include an observation by the viewer that is privately inside the place but publicly outside", done => {
        const obs = _.find( fixtures.elasticsearch.observations.observation, o => (
          o.private_place_ids
          && o.private_place_ids.includes( placeId )
          && !o.place_ids.includes( placeId )
          && o.user.id === nonMemberUser.id
        ) );
        expect( obs ).to.not.be.undefined;
        request( app ).get( `/v1/observations?project_id=${project.id}` )
          .set( "Authorization", token )
          .expect( res => {
            const resultObs = _.find( res.body.results, o => o.id === obs.id );
            expect( resultObs ).to.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );
    it( "shows authenticated trusted users private info", done => {
      const trustedUserToken = jwt.sign( { user_id: 125 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations?id=14" ).set( "Authorization", trustedUserToken )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "histogram", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/histogram" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  } );

  describe( "identifiers", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/identifiers" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "supports pagination", done => {
      request( app ).get( "/v1/observations/identifiers?per_page=1&page=2" ).expect( res => {
        expect( res.body.page ).to.eq( 2 );
        expect( res.body.per_page ).to.eq( 1 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "observers", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/observers" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "accepts an order_by param", done => {
      request( app ).get( "/v1/observations/observers?order_by=species_count" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "includes user name field", ( ) => {
      request( app ).get( "/v1/observations/observers" ).expect( res => {
        expect( res.results[0].user.name ).to.eq( "A User" );
      } );
    } );

    it( "supports pagination", done => {
      request( app ).get( "/v1/observations/observers?per_page=1&page=2" ).expect( res => {
        expect( res.body.page ).to.eq( 2 );
        expect( res.body.per_page ).to.eq( 1 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "supports pagination when ordering by species_count", done => {
      request( app ).get( "/v1/observations/observers?per_page=1&page=2&order_by=species_count" ).expect( res => {
        expect( res.body.page ).to.eq( 2 );
        expect( res.body.per_page ).to.eq( 1 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "should never return null total_results", done => {
      request( app ).get( "/v1/observations/observers?place_id=123" ).expect( res => {
        expect( res.body.total_results ).to.eq( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "species_counts", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/species_counts" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "sorts by count desc by default", done => {
      request( app ).get( "/v1/observations/species_counts" ).expect( res => {
        expect( res.body.results[0].count ).to.be.at.least( res.body.results[1].count );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can sort by count asc", done => {
      request( app ).get( "/v1/observations/species_counts?order=asc" ).expect( res => {
        expect( res.body.results[1].count ).to.be.at.least( res.body.results[0].count );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns taxa unobserved by a user", done => {
      request( app ).get( "/v1/observations/species_counts?unobserved_by_user_id=1&lat=50&lng=50" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].count ).to.eq( 1 );
          expect( res.body.results[0].taxon.id ).to.eq( 123 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "supports pagination", done => {
      request( app ).get( "/v1/observations/species_counts?per_page=1&page=2" ).expect( res => {
        expect( res.body.page ).to.eq( 2 );
        expect( res.body.per_page ).to.eq( 1 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "iconic_taxa_counts", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/iconic_taxa_counts" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  } );

  describe( "iconic_taxa_species_counts", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/observations/iconic_taxa_species_counts" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  } );

  describe( "updates", ( ) => {
    it( "fails for unauthenticated requests", done => {
      request( app ).get( "/v1/observations/updates" ).expect( res => {
        expect( res.error.text ).to.eq( "{\"error\":\"Unauthorized\",\"status\":401}" );
      } ).expect( "Content-Type", /json/ )
        .expect( 401, done );
    } );

    it( "allows authenticated requests", done => {
      const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates" ).set( "Authorization", token )
        .expect( res => {
          expect( res.err ).to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "shows updates on obs by viewer and not by viewer by default", done => {
      const ownerId = 123;
      const token = jwt.sign( { user_id: ownerId }, config.jwtSecret || "secret", { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results.find( r => r.resource_owner_id === ownerId ) ).to.exist;
          expect( res.body.results.find( r => r.resource_owner_id !== ownerId ) ).to.exist;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "filters on obs by viewer", done => {
      const ownerId = 123;
      const token = jwt.sign( { user_id: ownerId }, config.jwtSecret || "secret", { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates?observations_by=owner" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results.find( r => r.resource_owner_id === ownerId ) ).to.exist;
          expect( res.body.results.find( r => r.resource_owner_id !== ownerId ) ).to.not.exist;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "filters on obs by following", done => {
      const ownerId = 123;
      const token = jwt.sign( { user_id: ownerId }, config.jwtSecret || "secret", { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/updates?observations_by=following" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results.find( r => r.resource_owner_id !== ownerId ) ).to.exist;
          expect( res.body.results.find( r => r.resource_owner_id === ownerId ) ).to.not.exist;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "deleted", ( ) => {
    it( "fails for unauthenticated requests", done => {
      request( app ).get( "/v1/observations/deleted" )
        .expect( res => {
          expect( res.error.text ).to.eq( "{\"error\":\"Unauthorized\",\"status\":401}" );
        } ).expect( "Content-Type", /json/ )
        .expect( 401, done );
    } );

    it( "returns an empty array without a since param", done => {
      const token = jwt.sign( { user_id: 1 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/deleted" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 500 );
          expect( res.body.results.length ).to.eq( 0 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns observations deleted since date", done => {
      const token = jwt.sign( { user_id: 1 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/deleted?since=2016-01-01" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 3 );
          expect( res.body.results.length ).to.eq( 3 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "quality_grades", ( ) => {
    it( "returns quality_grade counts", done => {
      request( app ).get( "/v1/observations/quality_grades" ).expect( res => {
        const numRG = _.filter(
          fixtures.elasticsearch.observations.observation,
          o => o.quality_grade === "research"
        ).length;
        const rgResult = _.find( res.body.results, r => r.quality_grade === "research" );
        expect( rgResult ).not.to.be.undefined;
        expect( rgResult.count ).to.eq( numRG );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "identification_categories", ( ) => {
    it( "returns category counts", done => {
      request( app ).get( "/v1/observations/identification_categories" ).expect( res => {
        expect( res.body.results[0].category ).to.eq( "leading" );
        expect( res.body.results[0].count ).to.be.at.least( 1 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "umbrella_project_stats", ( ) => {
    it( "returns stats", done => {
      request( app ).get( "/v1/observations/umbrella_project_stats?project_id=first-umbrella" ).expect( res => {
        expect( res.body.results[0].project ).to.not.be.undefined;
        expect( res.body.results[0].observation_count ).to.not.be.undefined;
        expect( res.body.results[0].species_count ).to.not.be.undefined;
        expect( res.body.results[0].observers_count ).to.not.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "popular_field_values", ( ) => {
    it( "returns controlled attributes with the label field", done => {
      request( app ).get( "/v1/observations/popular_field_values" ).expect( res => {
        expect( res.body.results[0].controlled_attribute.label ).to.not.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
