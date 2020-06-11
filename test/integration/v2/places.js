const { expect } = require( "chai" );
const fs = require( "fs" );
const request = require( "supertest" );
const app = require( "../../../app" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Places", ( ) => {
  const fixturePlace = fixtures.elasticsearch.places.place[0];
  describe( "show", ( ) => {
    it( "returns json", done => {
      request( app ).get( `/v2/places/${fixturePlace.uuid}?fields=uuid` ).expect( res => {
        expect( res.body.results[0].uuid ).to.eq( fixturePlace.uuid );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
