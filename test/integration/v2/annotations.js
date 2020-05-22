// const { expect } = require( "chai" );
const _ = require( "lodash" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const fs = require( "fs" );
const config = require( "../../../config.js" );
const app = require( "../../../openapi_app" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Annotations", ( ) => {
  describe( "voting", ( ) => {
    const token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    const obs = _.find(
      fixtures.elasticsearch.observations.observation,
      o => o.annotations && o.annotations.length > 0
    );
    const anno = obs.annotations[0];

    describe( "vote", ( ) => {
      it( "returns 204 for success", done => {
        // Note that it doesn't really matter what Rails returns. The API just
        // cares about the HTTP status
        nock( "http://localhost:3000" )
          .post( `/votes/vote/annotation/${anno.uuid}` )
          .reply( 204, {} );
        request( app ).post( `/v2/annotations/${anno.uuid}/vote` )
          .set( "Authorization", token )
          .expect( 204, done );
      } );

      it( "accepts the vote param", done => {
        nock( "http://localhost:3000" )
          .post( `/votes/vote/annotation/${anno.uuid}` )
          .reply( 204, {} );
        request( app )
          .post( `/v2/annotations/${anno.uuid}/vote` )
          .set( "Authorization", token )
          .set( "Content-Type", "application/json" )
          .send( { vote: "bad" } )
          .expect( 204, done );
      } );
    } );
    describe( "unvote", ( ) => {
      it( "returns 204 for success", done => {
        nock( "http://localhost:3000" )
          .delete( `/votes/unvote/annotation/${anno.uuid}` )
          .reply( 204, {} );
        request( app ).delete( `/v2/annotations/${anno.uuid}/unvote` )
          .set( "Authorization", token )
          .expect( 204, done );
      } );
    } );
  } );
} );
