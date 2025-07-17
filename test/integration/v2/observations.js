const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const request = require( "supertest" );
const nock = require( "nock" );
const sinon = require( "sinon" );
const jwt = require( "jsonwebtoken" );
const { v4: uuidv4 } = require( "uuid" );
const config = require( "../../../config" );
const ESModel = require( "../../../lib/models/es_model" );
const ObservationsController = require( "../../../lib/controllers/v1/observations_controller" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );
let obs;

describe( "Observations", ( ) => {
  const fixtureObs = fixtures.elasticsearch.observations.observation[0];
  describe( "show", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( `/v2/observations/${fixtureObs.uuid}` ).expect( res => {
        expect( res.body.results[0].uuid ).to.eq( fixtureObs.uuid );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns 422 for malformed UUID, integer", function ( done ) {
      request( this.app ).get( "/v2/observations/12345" )
        .expect( 422, done );
    } );

    it( "returns 422 for malformed UUID, string", function ( done ) {
      request( this.app ).get( "/v2/observations/abcde" )
        .expect( 422, done );
    } );

    it( "returns 404 for unknown UUID", function ( done ) {
      request( this.app ).get( `/v2/observations/${uuidv4()}` )
        .expect( 404, done );
    } );

    it( "returns 404 for multiple unknown UUIDs", function ( done ) {
      request( this.app ).get( `/v2/observations/${uuidv4()},${uuidv4()}` )
        .expect( 404, done );
    } );

    it( "returns 200 for one known and one unknown UUID", function ( done ) {
      request( this.app ).get( `/v2/observations/${fixtureObs.uuid},${uuidv4()}` ).expect( res => {
        expect( res.body.results[0].uuid ).to.eq( fixtureObs.uuid );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns the uuid when specified in the fields query param", function ( done ) {
      request( this.app ).get( `/v2/observations/${fixtureObs.uuid}?fields=id,uuid` ).expect( res => {
        expect( res.body.results[0].uuid ).to.eq( fixtureObs.uuid );
      } ).expect( 200, done );
    } );

    it( "returns the uuid and quality_grade when all fields", function ( done ) {
      request( this.app ).get( `/v2/observations/${fixtureObs.uuid}?fields=all` ).expect( res => {
        expect( res.body.results[0].uuid ).to.eq( fixtureObs.uuid );
        expect( res.body.results[0].quality_grade ).to.eq( fixtureObs.quality_grade );
      } ).expect( 200, done );
    } );

    it( "returns the user name and login when requesting all user fields", function ( done ) {
      request( this.app )
        .post( `/v2/observations/${fixtureObs.uuid}` )
        .set( "Content-Type", "application/json" )
        .send( {
          fields: { user: "all" }
        } )
        .set( "X-HTTP-Method-Override", "GET" )
        .expect( res => {
          expect( res.body.results[0].user.login ).to.eq( fixtureObs.user.login );
          expect( res.body.results[0].user.name ).to.eq( fixtureObs.user.name );
        } )
        .expect( 200, done );
    } );
    it( "shows authenticated users their own private info", function ( done ) {
      obs = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 1 );
      const token = jwt.sign( { user_id: 123 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( `/v2/observations/${obs.uuid}?fields=all` ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "shows authenticated project curators private info if they have access", function ( done ) {
      obs = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 10 );
      const token = jwt.sign( { user_id: 123 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( `/v2/observations/${obs.uuid}?fields=all` ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "shows authenticated trusted users private info", function ( done ) {
      obs = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 14 );
      const token = jwt.sign( { user_id: 125 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( `/v2/observations/${obs.uuid}?fields=all` ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not show authenticated project curators private info if they do not have access", function ( done ) {
      obs = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 11 );
      const token = jwt.sign( { user_id: 123 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( `/v2/observations/${obs.uuid}?fields=all` ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not show authenticated users others' private info", function ( done ) {
      obs = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 333 );
      const token = jwt.sign( { user_id: 123 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( `/v2/observations/${obs.uuid}?fields=all` ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user in observation", function ( done ) {
      request( this.app ).get( "/v2/observations/78e0b6e4-61fa-11ee-8c99-0242ac120002?fields=all" ).expect( res => {
        const observation = res.body.results[0];
        expect( res.body.page ).to.eq( 1 );
        expect( res.body.total_results ).to.eq( 1 );
        expect( res.body.results.length ).to.eq( 1 );
        expect( observation.id ).to.eq( 2023092501 );
        expect( observation.user ).not.to.be.undefined;
        expect( observation.user.id ).to.eq( 2023092501 );
        expect( observation.user.email ).to.be.undefined;
        expect( observation.user.last_ip ).to.be.undefined;
        expect( observation.identifications ).not.to.be.undefined;
        expect( observation.identifications.length ).to.eq( 1 );
        expect( observation.identifications[0].user ).not.to.be.undefined;
        expect( observation.identifications[0].user.id ).to.eq( 2023092501 );
        expect( observation.identifications[0].user.email ).to.be.undefined;
        expect( observation.identifications[0].user.last_ip ).to.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "maps vote_score_short to vote_score for response", function ( done ) {
      const observationWithAnnotationVotes = _.find(
        fixtures.elasticsearch.observations.observation,
        o => !_.isEmpty( o.annotations ) && _.find( o.annotations, a => a.vote_score_short === 1 )
      );
      request( this.app )
        .post( "/v2/observations" )
        .set( "Content-Type", "application/json" )
        .send( {
          id: observationWithAnnotationVotes.id,
          fields: {
            annotations: "all"
          }
        } )
        .set( "X-HTTP-Method-Override", "GET" )
        .expect( res => {
          expect(
            _.find( res.body.results[0].annotations, a => a.vote_score === 1 )
          ).to.not.be.undefined;
          expect(
            _.find( res.body.results[0].annotations, a => a.vote_score_short === 1 )
          ).to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "includes media moderator actions", function ( done ) {
      obs = _.find( fixtures.elasticsearch.observations.observation, o => (
        o.description === "Observation with media with moderator actions"
      ) );
      request( this.app ).get( `/v2/observations/${obs.uuid}?fields=all` )
        .expect( res => {
          expect( res.body.results[0].photos.length ).to.eq( 1 );
          expect( res.body.results[0].photos[0].moderator_actions.length ).to.eq( 1 );
          expect( res.body.results[0].photos[0].moderator_actions[0].user ).to.not.be.null;

          expect( res.body.results[0].sounds.length ).to.eq( 1 );
          expect( res.body.results[0].sounds[0].moderator_actions.length ).to.eq( 1 );
          expect( res.body.results[0].sounds[0].moderator_actions[0].user ).to.not.be.null;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "media moderator actions have null user if user does not exist", function ( done ) {
      obs = _.find( fixtures.elasticsearch.observations.observation, o => (
        o.description === "Observation with media with moderator actions with no users"
      ) );
      request( this.app ).get( `/v2/observations/${obs.uuid}?fields=all` )
        .expect( res => {
          expect( res.body.results[0].photos.length ).to.eq( 1 );
          expect( res.body.results[0].photos[0].moderator_actions.length ).to.eq( 1 );
          expect( res.body.results[0].photos[0].moderator_actions[0].user ).to.be.null;

          expect( res.body.results[0].sounds.length ).to.eq( 1 );
          expect( res.body.results[0].sounds[0].moderator_actions.length ).to.eq( 1 );
          expect( res.body.results[0].sounds[0].moderator_actions[0].user ).to.be.null;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    // the observations.show endpoint should use the ES mget method to fetch observations for the
    // show endpoint, unless there are additional parameters that will filter the observations
    // returned. This is because the mget method is not affected by the normal ES refresh cycle,
    // whereas search is. This allows observation records to be returned immediately after they
    // have been updated without waiting for the next refresh. This is useful for clients that may
    // modify an observation or associated records and immediately re-fetch the observation record
    // to get its update metadata and associations that may have been just modified.
    describe( "show mget", ( ) => {
      const esModelSandbox = sinon.createSandbox( );

      beforeEach( ( ) => {
        esModelSandbox.spy( ESModel, "mgetResults" );
        esModelSandbox.spy( ESModel, "elasticResults" );
      } );

      afterEach( ( ) => {
        esModelSandbox.restore( );
      } );

      it( "calls mget when there are no additional parameters", function ( done ) {
        obs = fixtures.elasticsearch.observations.observation[0];
        request( this.app ).get( `/v2/observations/${obs.uuid}` )
          .expect( ( ) => {
            expect( ESModel.mgetResults ).to.have.been.calledOnce;
            expect( ESModel.elasticResults ).to.have.not.been.called;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "calls mget even when there is a fields param", function ( done ) {
        obs = fixtures.elasticsearch.observations.observation[0];
        request( this.app ).get( `/v2/observations/${obs.uuid}?fields=all` )
          .expect( ( ) => {
            expect( ESModel.mgetResults ).to.have.been.calledOnce;
            expect( ESModel.elasticResults ).to.have.not.been.called;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "calls elsaticResults even when there are additional parameters", function ( done ) {
        obs = fixtures.elasticsearch.observations.observation[0];
        request( this.app ).get( `/v2/observations/${obs.uuid}?taxon_id=${obs.taxon.id}` )
          .expect( ( ) => {
            expect( ESModel.mgetResults ).to.have.not.been.called;
            expect( ESModel.elasticResults ).to.have.been.calledOnce;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );
  } );

  describe( "search", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v2/observations" ).expect( res => {
        expect( res.body.results[0].uuid ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns 422 for validation errors", function ( done ) {
      request( this.app ).get( "/v2/observations?rank=nonsense" )
        .expect( 422, done );
    } );

    it( "returns user when specified in the fields query param", function ( done ) {
      request( this.app ).get( "/v2/observations?fields=user" ).expect( res => {
        expect( res.body.results[0].user ).to.not.be.undefined;
      } ).expect( 200, done );
    } );

    it( "should error when you POST with X-HTTP-Method-Override set to GET and a multipart/form-data payload", function ( done ) {
      request( this.app )
        .post( "/v2/observations" )
        .send( `user_id=${fixtureObs.user.id}&fields=user` )
        .set( "Content-Type", "multipart/form-data" )
        .set( "X-HTTP-Method-Override", "GET" )
        .expect( res => {
          expect( res.body.status ).to.eq( "422" );
        } )
        .expect( 422, done );
    } );

    it( "should search when you POST with X-HTTP-Method-Override set to GET and a JSON payload", function ( done ) {
      request( this.app )
        .post( "/v2/observations" )
        .set( "Content-Type", "application/json" )
        .send( {
          user_id: fixtureObs.user.id,
          fields: ["user"]
        } )
        .set( "X-HTTP-Method-Override", "GET" )
        .expect( res => {
          expect( res.body.results[0].user.id ).to.eq( fixtureObs.user.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "shows authenticated users their own private info", function ( done ) {
      const userId = 123;
      const token = jwt.sign( { user_id: userId },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( `/v2/observations?user_id=${userId}&fields=all` ).set( "Authorization", token )
        .expect( res => {
          const obscuredObs = _.find( res.body.results, o => o.obscured );
          expect( obscuredObs.private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not show authenticated users others' private info", function ( done ) {
      const token = jwt.sign( { user_id: 5 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( "/v2/observations?user_id=123&fields=all" ).set( "Authorization", token )
        .expect( res => {
          const obscuredObs = _.find( res.body.results, o => o.obscured );
          expect( obscuredObs.private_location ).to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "accepts place UUID", function ( done ) {
      const usUUID = fixtures.elasticsearch.places.place[0].uuid;
      request( this.app ).get( `/v2/observations?place_id=${usUUID}` ).expect( res => {
        expect( res.body.results[0].uuid ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "accepts multiple place UUIDs", function ( done ) {
      const uuids = fixtures.elasticsearch.places.place.slice( 0, 2 ).map( p => p.uuid );
      request( this.app ).get( `/v2/observations?place_id=${uuids.join( "," )}` ).expect( res => {
        expect( res.body.results[0].uuid ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "accepts place UUID with X-HTTP-Method-Override", function ( done ) {
      const usUUID = fixtures.elasticsearch.places.place[0].uuid;
      request( this.app )
        .post( "/v2/observations" )
        .set( "Content-Type", "application/json" )
        .send( { place_id: usUUID } )
        .set( "X-HTTP-Method-Override", "GET" )
        .expect( res => {
          expect( res.body.results[0].uuid ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "accepts multiple place UUIDs with X-HTTP-Method-Override", function ( done ) {
      const uuids = fixtures.elasticsearch.places.place.slice( 0, 2 ).map( p => p.uuid );
      request( this.app )
        .post( "/v2/observations" )
        .set( "Content-Type", "application/json" )
        .send( { place_id: uuids } )
        .set( "X-HTTP-Method-Override", "GET" )
        .expect( res => {
          expect( res.body.results[0].uuid ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can return fields not returned by v1", function ( done ) {
      // application can only be returned by v2, if requested
      request( this.app ).get( "/v2/observations?oauth_application_id=3&fields=application" ).expect( res => {
        expect( res.body.results[0].application ).to.be.an( "object" );
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can set a cacheControl header with ttl param", function ( done ) {
      request( this.app )
        .get( "/v2/observations?ttl=123" )
        .expect( res => {
          expect( res.get( "Cache-Control" ) ).to.eq( "public, max-age=123" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "sets a default ttl", function ( done ) {
      request( this.app )
        .get( "/v2/observations" )
        .expect( res => {
          expect( res.get( "Cache-Control" ) ).to.eq( "public, max-age=300" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "sets no-cache headers when ttl=-1", function ( done ) {
      request( this.app )
        .get( "/v2/observations?ttl=-1" )
        .expect( res => {
          expect( res.get( "Cache-Control" ) ).to.eq( "private, no-cache, no-store, must-revalidate" );
          expect( res.get( "Expires" ) ).to.eq( "-1" );
          expect( res.get( "Pragma" ) ).to.eq( "no-cache" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "should error with internal server error as result window is too large for elastic search", function ( done ) {
      request( this.app )
        .get( "/v2/observations?page=700" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.errors ).to.exist;
          // We return a special case error message, detect if it contains part of it
          expect( res.body.errors[0].message ).to.contains( "page x size" );
        } )
        .expect( 500, done );
    } );

    it( "never returns email or IP for user in observation", function ( done ) {
      request( this.app ).get( "/v2/observations?id=2023092501&fields=all" ).expect( res => {
        const observation = res.body.results[0];
        expect( res.body.page ).to.eq( 1 );
        expect( res.body.total_results ).to.eq( 1 );
        expect( res.body.results.length ).to.eq( 1 );
        expect( observation.id ).to.eq( 2023092501 );
        expect( observation.user ).not.to.be.undefined;
        expect( observation.user.id ).to.eq( 2023092501 );
        expect( observation.user.email ).to.be.undefined;
        expect( observation.user.last_ip ).to.be.undefined;
        expect( observation.identifications ).not.to.be.undefined;
        expect( observation.identifications.length ).to.eq( 1 );
        expect( observation.identifications[0].user ).not.to.be.undefined;
        expect( observation.identifications[0].user.id ).to.eq( 2023092501 );
        expect( observation.identifications[0].user.email ).to.be.undefined;
        expect( observation.identifications[0].user.last_ip ).to.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    describe( "sandbox", ( ) => {
      const sandbox = sinon.createSandbox( );

      beforeEach( ( ) => {
        sandbox.spy( ESModel, "elasticResults" );
      } );

      afterEach( ( ) => {
        sandbox.restore( );
      } );

      it( "accepts radius float values", function ( done ) {
        request( this.app ).get( "/v2/observations?lat=1&lng=1&radius=10.1" ).expect( ( ) => {
          expect( ESModel.elasticResults ).to.have.been.calledWith(
            sinon.match.any, {
              where: undefined,
              filters: [{
                geo_distance: {
                  distance: "10.1km",
                  location: {
                    lat: 1,
                    lon: 1
                  }
                }
              }],
              inverse_filters: [],
              grouped_inverse_filters: [],
              per_page: 30,
              page: 1,
              sort: {
                created_at: "desc"
              }
            }, "observations", sinon.match.any
          );
        } )
          .expect( 200, done );
      } );

      it( "accepts radius values less than 1", function ( done ) {
        request( this.app ).get( "/v2/observations?lat=1&lng=1&radius=0.001" ).expect( ( ) => {
          expect( ESModel.elasticResults ).to.have.been.calledWith(
            sinon.match.any, {
              where: undefined,
              filters: [{
                geo_distance: {
                  distance: "0.001km",
                  location: {
                    lat: 1,
                    lon: 1
                  }
                }
              }],
              inverse_filters: [],
              grouped_inverse_filters: [],
              per_page: 30,
              page: 1,
              sort: {
                created_at: "desc"
              }
            }, "observations", sinon.match.any
          );
        } )
          .expect( 200, done );
      } );
    } );

    describe( "obscuration", ( ) => {
      it( "filters by obscuration=obscured", function ( done ) {
        request( this.app ).get(
          "/v2/observations?obscuration=obscured&fields=geoprivacy,taxon_geoprivacy"
        ).expect( res => {
          expect( res.body.results.length ).to.above( 0 );
          expect( _.every( res.body.results, r => (
            r.geoprivacy === "obscured" || r.taxon_geoprivacy === "obscured"
          ) ) ).to.be.true;
          expect( _.some( res.body.results, r => (
            r.geoprivacy === "obscured" && r.taxon_geoprivacy !== "obscured"
          ) ) ).to.be.true;
          expect( _.some( res.body.results, r => (
            r.geoprivacy !== "obscured" && r.taxon_geoprivacy === "obscured"
          ) ) ).to.be.true;
        } ).expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "filters by obscuration=private", function ( done ) {
        request( this.app ).get(
          "/v2/observations?per_page=200&obscuration=private&fields=geoprivacy,taxon_geoprivacy"
        ).expect( res => {
          expect( res.body.results.length ).to.above( 0 );
          expect( _.every( res.body.results, r => (
            r.geoprivacy === "private" || r.taxon_geoprivacy === "private"
          ) ) ).to.be.true;
          expect( _.some( res.body.results, r => (
            r.geoprivacy === "private" && r.taxon_geoprivacy !== "private"
          ) ) ).to.be.true;
          expect( _.some( res.body.results, r => (
            r.geoprivacy !== "private" && r.taxon_geoprivacy === "private"
          ) ) ).to.be.true;
        } ).expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "filters by obscuration=obscured,private", function ( done ) {
        request( this.app ).get(
          "/v2/observations?per_page=200&obscuration=obscured,private&fields=geoprivacy,taxon_geoprivacy"
        ).expect( res => {
          expect( res.body.results.length ).to.above( 0 );
          expect( _.every( res.body.results, r => (
            r.geoprivacy === "private" || r.taxon_geoprivacy === "private"
            || r.geoprivacy === "obscured" || r.taxon_geoprivacy === "obscured"
          ) ) ).to.be.true;
          expect( _.some( res.body.results, r => (
            r.geoprivacy !== "obscured" && r.taxon_geoprivacy !== "obscured"
          ) ) ).to.be.true;
          expect( _.some( res.body.results, r => (
            r.geoprivacy !== "private" && r.taxon_geoprivacy !== "private"
          ) ) ).to.be.true;
        } ).expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "filters by obscuration=none", function ( done ) {
        request( this.app ).get(
          "/v2/observations?per_page=200&obscuration=none&fields=geoprivacy,taxon_geoprivacy"
        ).expect( res => {
          expect( res.body.results.length ).to.above( 0 );
          expect( _.every( res.body.results, r => (
            r.geoprivacy !== "private" && r.taxon_geoprivacy !== "private"
            && r.geoprivacy !== "obscured" && r.taxon_geoprivacy !== "obscured"
          ) ) ).to.be.true;
        } ).expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );
  } );

  describe( "create", ( ) => {
    it( "returns private coordinates when geoprivacy is private", function ( done ) {
      const o = fixtures.elasticsearch.observations.observation[5];
      expect( o.geoprivacy ).to.eq( "private" );
      expect( o.location ).to.be.undefined;
      const token = jwt.sign( { user_id: 333 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      nock( "http://localhost:3000" )
        .post( "/observations" )
        .reply( 200, [{ id: o.id, uuid: o.uuid }] );
      request( this.app ).post( "/v2/observations" )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        // it doesn't really matter what we post since we're just stubbing the
        // Rails app to return obs 6 to load from the ES index
        // We're testing with these fields so let's make sure to get them in the response
        .send( {
          observation: { },
          fields: {
            private_geojson: {
              coordinates: true
            },
            private_location: true
          }
        } )
        .expect( 200 )
        .expect( res => {
          const resObs = res.body.results[0];
          expect( resObs.private_geojson.coordinates[1] ).to
            .eq( o.private_geojson.coordinates[1] );
          expect( resObs.private_location ).not.to.be.undefined;
          expect( resObs.private_location ).to.eq( o.private_location );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "update", ( ) => {
    const token = jwt.sign( { user_id: fixtureObs.user.id },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    it( "returns json", function ( done ) {
      const newDesc = "lskdgnlskdng";
      // Using nock to stub the rails response is not enough here b/c the v1
      // controller will load fresh data from the ES index, so if we want to see
      // a change without actually changing data, we need to stub the v1
      // controller reponse
      sinon.stub( ObservationsController, "update" )
        .callsFake(
          ( ) => ( { ...fixtureObs, description: newDesc } )
        );
      request( this.app ).put( `/v2/observations/${fixtureObs.uuid}` )
        .set( "observation", JSON.stringify( { } ) )
        .field( "fields", JSON.stringify( { description: true } ) )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results[0].uuid ).to.eq( fixtureObs.uuid );
          expect( res.body.results[0].description ).to.eq( newDesc );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "delete", ( ) => {
    const token = jwt.sign( { user_id: fixtureObs.user.id },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    it( "should not return anything if successful", function ( done ) {
      nock( "http://localhost:3000" )
        .delete( `/observations/${fixtureObs.uuid}` )
        .reply( 200 );
      request( this.app ).delete( `/v2/observations/${fixtureObs.uuid}` )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .expect( 200 )
        .expect( res => {
          expect( res.body ).to.eq( "" );
        } )
        .expect( 200, done );
    } );
  } );

  describe( "taxon_summary", ( ) => {
    it( "should include a relevant listed taxon", function ( done ) {
      const o = fixtures.elasticsearch.observations.observation[0];
      const railsResponse = {
        conservation_status: null,
        listed_taxon: {
          id: 1,
          establishment_means_label: "introduced"
        },
        wikipedia_summary: "bar"
      };
      nock( "http://localhost:3000" )
        .get( `/observations/${o.id}/taxon_summary` )
        .reply( 200, railsResponse );
      request( this.app ).get( `/v2/observations/${o.uuid}/taxon_summary` )
        .set( "Content-Type", "application/json" )
        .expect( 200 )
        .expect( res => {
          expect( res.body.listed_taxon.establishment_means_label )
            .to.eq( railsResponse.listed_taxon.establishment_means_label );
        } )
        .expect( 200, done );
    } );
  } );

  describe( "fave", ( ) => {
    const token = jwt.sign( { user_id: 123 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    it( "returns an empty success on POST", function ( done ) {
      nock( "http://localhost:3000" )
        .post( `/votes/vote/observation/${fixtureObs.id}` )
        .reply( 200 );
      request( this.app ).post( `/v2/observations/${fixtureObs.uuid}/fave` )
        .set( "Authorization", token )
        .expect( 204, done );
    } );
    it( "returns an empty success on DELETE", function ( done ) {
      nock( "http://localhost:3000" )
        .delete( `/votes/unvote/observation/${fixtureObs.id}` )
        .reply( 204 );
      request( this.app ).delete( `/v2/observations/${fixtureObs.uuid}/fave` )
        .set( "Authorization", token )
        .expect( 204, done );
    } );
  } );

  describe( "quality metric voting", ( ) => {
    const token = jwt.sign( { user_id: 123 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    describe( "POST", ( ) => {
      it( "should fail on a bad metric", function ( done ) {
        request( this.app ).delete( `/v2/observations/${fixtureObs.uuid}/quality/wyld` )
          .set( "Authorization", token )
          .expect( 422, done );
      } );
      it( "should accept the agree query param", function ( done ) {
        nock( "http://localhost:3000" )
          .post( `/observations/${fixtureObs.id}/quality/wild` )
          .reply( 204 );
        request( this.app ).post( `/v2/observations/${fixtureObs.uuid}/quality/wild` )
          .set( "Authorization", token )
          .set( "Content-Type", "application/json" )
          .send( {
            agree: false
          } )
          .expect( 204, done );
      } );
      it( "should treat needs_id the same even though it's not a QualityMetric", function ( done ) {
        nock( "http://localhost:3000" )
          .post( `/votes/vote/observation/${fixtureObs.id}` )
          .reply( 204 );
        request( this.app ).post( `/v2/observations/${fixtureObs.uuid}/quality/needs_id` )
          .set( "Authorization", token )
          .set( "Content-Type", "application/json" )
          .send( {
            agree: false
          } )
          .expect( 204, done );
      } );
    } );
    describe( "DELETE", ( ) => {
      it( "should return an empty success", function ( done ) {
        nock( "http://localhost:3000" )
          .delete( `/observations/${fixtureObs.id}/quality/wild` )
          .reply( 204 );
        request( this.app ).delete( `/v2/observations/${fixtureObs.uuid}/quality/wild` )
          .set( "Authorization", token )
          .expect( 204, done );
      } );
    } );
  } );

  describe( "viewed_updates", ( ) => {
    const token = jwt.sign( { user_id: 123 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    it( "returns an empty success on PUT", function ( done ) {
      nock( "http://localhost:3000" )
        .put( `/observations/${fixtureObs.uuid}/viewed_updates` )
        .reply( 200 );
      request( this.app ).put( `/v2/observations/${fixtureObs.uuid}/viewed_updates` )
        .set( "Authorization", token )
        .expect( 204, done );
    } );
  } );

  describe( "speciesCounts", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v2/observations/species_counts" ).expect( res => {
        expect( res.body.results[0].taxon ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not return ancestors by default", function ( done ) {
      request( this.app ).get( "/v2/observations/species_counts?taxon_id=3" ).expect( res => {
        expect( res.body.results[0].taxon.ancestors ).to.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns ancestors if requested", function ( done ) {
      request( this.app ).get(
        "/v2/observations/species_counts?fields=all&taxon_id=3&include_ancestors=true"
      ).expect( res => {
        expect( res.body.results[0].taxon.ancestors ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "observers", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v2/observations/observers?user_id=1" ).expect( res => {
        expect( res.body.results[0].user ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user in observation", function ( done ) {
      request( this.app ).get( "/v2/observations/observers?user_id=2023092501&fields=all" ).expect( res => {
        const observation = res.body.results[0];
        expect( res.body.page ).to.eq( 1 );
        expect( res.body.total_results ).to.eq( 1 );
        expect( res.body.results.length ).to.eq( 1 );
        expect( observation.user ).not.to.be.undefined;
        expect( observation.user.id ).to.eq( 2023092501 );
        expect( observation.user.email ).to.be.undefined;
        expect( observation.user.last_ip ).to.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "popularFieldValues", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v2/observations/popular_field_values" ).expect( res => {
        expect( res.body.results[0] ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "histogram", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v2/observations/histogram" ).expect( res => {
        expect( res.body.results ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "deleted", ( ) => {
    it( "should 401 without auth", function ( done ) {
      request( this.app )
        .get( "/v2/observations/deleted" )
        .expect( 401, done );
    } );

    it( "requires a `since` param", function ( done ) {
      const token = jwt.sign( { user_id: 123 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app )
        .get( "/v2/observations/deleted" )
        .set( "Authorization", token )
        .expect( res => {
          expect( JSON.stringify( res.body ) ).to.include( "must have required property 'since'" );
        } )
        .expect( 422, done );
    } );

    it( "returns json", function ( done ) {
      const token = jwt.sign( { user_id: 123 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      nock( "http://localhost:3000" )
        .put( "/observations/deleted" )
        .reply( 200 );
      request( this.app )
        .get( "/v2/observations/deleted?since=2022-01-01" )
        .set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
