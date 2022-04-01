const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const request = require( "supertest" );
const nock = require( "nock" );
const sinon = require( "sinon" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config.js" );
const app = require( "../../../app" );
const ObservationsController = require( "../../../lib/controllers/v1/observations_controller" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Observations", ( ) => {
  const fixtureObs = fixtures.elasticsearch.observations.observation[0];
  describe( "show", ( ) => {
    it( "returns json", done => {
      request( app ).get( `/v2/observations/${fixtureObs.uuid}` ).expect( res => {
        expect( res.body.results[0].uuid ).to.eq( fixtureObs.uuid );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns the uuid when specified in the fields query param", done => {
      request( app ).get( `/v2/observations/${fixtureObs.uuid}?fields=id,uuid` ).expect( res => {
        expect( res.body.results[0].uuid ).to.eq( fixtureObs.uuid );
      } ).expect( 200, done );
    } );
    it( "returns the uuid and quality_grade when all fields", done => {
      request( app ).get( `/v2/observations/${fixtureObs.uuid}?fields=all` ).expect( res => {
        expect( res.body.results[0].uuid ).to.eq( fixtureObs.uuid );
        expect( res.body.results[0].quality_grade ).to.eq( fixtureObs.quality_grade );
      } ).expect( 200, done );
    } );
    it( "returns the user name and login when requesting all user fields", done => {
      request( app )
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
    it( "shows authenticated users their own private info", done => {
      const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/1?fields=all" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "shows authenticated project curators private info if they have access", done => {
      const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/10?fields=all" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "shows authenticated trusted users private info", done => {
      const token = jwt.sign( { user_id: 125 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/14?fields=all" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not show authenticated project curators private info if they do not have access", done => {
      const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/11?fields=all" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not show authenticated users others' private info", done => {
      const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations/333?fields=all" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].private_location ).to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "search", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v2/observations" ).expect( res => {
        expect( res.body.results[0].uuid ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns user when specified in the fields query param", done => {
      request( app ).get( "/v2/observations?fields=user" ).expect( res => {
        expect( res.body.results[0].user ).to.not.be.undefined;
      } ).expect( 200, done );
    } );

    it( "should error when you POST with X-HTTP-Method-Override set to GET and a multipart/form-data payload", done => {
      request( app )
        .post( "/v2/observations" )
        .send( `user_id=${fixtureObs.user.id}&fields=user` )
        .set( "Content-Type", "multipart/form-data" )
        .set( "X-HTTP-Method-Override", "GET" )
        .expect( res => {
          expect( res.body.status ).to.eq( "422" );
        } )
        .expect( 422, done );
    } );

    it( "should search when you POST with X-HTTP-Method-Override set to GET and a JSON payload", done => {
      request( app )
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

    it( "shows authenticated users their own private info", done => {
      const userId = 123;
      const token = jwt.sign( { user_id: userId }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( `/v1/observations?user_id=${userId}&fields=all` ).set( "Authorization", token )
        .expect( res => {
          const obscuredObs = _.find( res.body.results, o => o.obscured );
          expect( obscuredObs.private_location ).to.not.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not show authenticated users others' private info", done => {
      const token = jwt.sign( { user_id: 5 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( "/v1/observations?user_id=123&fields=all" ).set( "Authorization", token )
        .expect( res => {
          const obscuredObs = _.find( res.body.results, o => o.obscured );
          expect( obscuredObs.private_location ).to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "accepts place UUID", done => {
      const usUUID = fixtures.elasticsearch.places.place[0].uuid;
      request( app ).get( `/v2/observations?place_id=${usUUID}` ).expect( res => {
        expect( res.body.results[0].uuid ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "accepts multiple place UUIDs", done => {
      const uuids = fixtures.elasticsearch.places.place.slice( 0, 2 ).map( p => p.uuid );
      request( app ).get( `/v2/observations?place_id=${uuids.join( "," )}` ).expect( res => {
        expect( res.body.results[0].uuid ).to.not.be.undefined;
      } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "accepts place UUID with X-HTTP-Method-Override", done => {
      const usUUID = fixtures.elasticsearch.places.place[0].uuid;
      request( app )
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

    it( "accepts multiple place UUIDs with X-HTTP-Method-Override", done => {
      const uuids = fixtures.elasticsearch.places.place.slice( 0, 2 ).map( p => p.uuid );
      request( app )
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
  } );

  describe( "create", ( ) => {
    it( "returns private coordinates when geoprivacy is private", done => {
      const o = fixtures.elasticsearch.observations.observation[5];
      expect( o.geoprivacy ).to.eq( "private" );
      expect( o.location ).to.be.undefined;
      const token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      nock( "http://localhost:3000" )
        .post( "/observations" )
        .reply( 200, [{ id: o.id, uuid: o.uuid }] );
      request( app ).post( "/v2/observations" )
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
      config.jwtSecret || "secret", { algorithm: "HS512" } );
    it( "returns json", done => {
      const newDesc = "lskdgnlskdng";
      // Using nock to stub the rails response is not enough here b/c the v1
      // controller will load fresh data from the ES index, so if we want to see
      // a change without actually changing data, we need to stub the v1
      // controller reponse
      sinon.stub( ObservationsController, "update" )
        .callsFake(
          ( ) => Object.assign( {}, fixtureObs, { description: newDesc } )
        );
      request( app ).put( `/v2/observations/${fixtureObs.uuid}` )
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

  // // This test won't work b/c for some reason nock won't stub requests made by
  // // inatjs ~~ kueda 20200418
  // describe.only( "taxon_summary", ( ) => {
  //   it( "should include a relevant listed taxon", done => {
  //     const o = fixtures.elasticsearch.observations.observation[0];
  //     const railsResponse = {
  //       conservation_status: {},
  //       listed_taxon: {
  //         establishment_means_label: "introduced"
  //       },
  //       wikipedia_summary: "bar"
  //     };
  //     nock( "http://localhost:3000" )
  //       .get( `/observations/${o.id}/taxon_summary` )
  //       .reply( 200, railsResponse );
  //     request( app ).get( `/v2/observations/${o.uuid}/taxon_summary` )
  //       .set( "Content-Type", "application/json" )
  //       .expect( 200 )
  //       .expect( res => {
  //         expect( res.body.listed_taxon.establishment_means_label )
  //           .to.eq( railsResponse.listed_taxon.establishment_means_label );
  //       } )
  //       .expect( 200, done );
  //   } );
  // } );

  describe( "fave", ( ) => {
    const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    it( "returns an empty success on POST", done => {
      nock( "http://localhost:3000" )
        .post( `/votes/vote/observation/${fixtureObs.id}` )
        .reply( 200 );
      request( app ).post( `/v2/observations/${fixtureObs.uuid}/fave` )
        .set( "Authorization", token )
        .expect( 204, done );
    } );
    it( "returns an empty success on DELETE", done => {
      nock( "http://localhost:3000" )
        .delete( `/votes/unvote/observation/${fixtureObs.id}` )
        .reply( 204 );
      request( app ).delete( `/v2/observations/${fixtureObs.uuid}/fave` )
        .set( "Authorization", token )
        .expect( 204, done );
    } );
  } );

  describe( "quality metric voting", ( ) => {
    const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    describe( "POST", ( ) => {
      it( "should fail on a bad metric", done => {
        request( app ).delete( `/v2/observations/${fixtureObs.uuid}/quality/wyld` )
          .set( "Authorization", token )
          .expect( 400, done );
      } );
      it( "should accept the agree query param", done => {
        nock( "http://localhost:3000" )
          .post( `/observations/${fixtureObs.id}/quality/wild` )
          .reply( 204 );
        request( app ).post( `/v2/observations/${fixtureObs.uuid}/quality/wild` )
          .set( "Authorization", token )
          .set( "Content-Type", "application/json" )
          .send( {
            agree: false
          } )
          .expect( 204, done );
      } );
      it( "should treat needs_id the same even though it's not a QualityMetric", done => {
        nock( "http://localhost:3000" )
          .post( `/votes/vote/observation/${fixtureObs.id}` )
          .reply( 204 );
        request( app ).post( `/v2/observations/${fixtureObs.uuid}/quality/needs_id` )
          .set( "Authorization", token )
          .set( "Content-Type", "application/json" )
          .send( {
            agree: false
          } )
          .expect( 204, done );
      } );
    } );
    describe( "DELETE", ( ) => {
      it( "should return an empty success", done => {
        nock( "http://localhost:3000" )
          .delete( `/observations/${fixtureObs.id}/quality/wild` )
          .reply( 204 );
        request( app ).delete( `/v2/observations/${fixtureObs.uuid}/quality/wild` )
          .set( "Authorization", token )
          .expect( 204, done );
      } );
    } );
  } );
} );
