const { expect } = require( "chai" );
const fs = require( "fs" );
const request = require( "supertest" );
const app = require( "../../../openapi_app" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Observations", ( ) => {
  describe( "show", ( ) => {
    const fixtureObs = fixtures.elasticsearch.observations.observation[0];
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
  } );
} );
