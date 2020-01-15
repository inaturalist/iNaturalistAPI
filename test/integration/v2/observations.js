const { expect } = require( "chai" );
const fs = require( "fs" );
const request = require( "supertest" );
const app = require( "../../../openapi_app" );

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
          expect( res.body.status ).to.eq( 422 );
        } )
        .expect( 422, done );
    } );
    it( "should search when you POST with X-HTTP-Method-Overrid set to GET and a JSON payload", done => {
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
  } );
} );
