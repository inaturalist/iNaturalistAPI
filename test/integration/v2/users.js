const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const request = require( "supertest" );
const config = require( "../../../config.js" );
const app = require( "../../../app" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Users", ( ) => {
  describe( "update_session", ( ) => {
    const currentUser = fixtures.elasticsearch.users.user[0];
    const token = jwt.sign( { user_id: currentUser.id }, config.jwtSecret || "secret",
      { algorithm: "HS512" } );

    it( "should fail without auth", done => {
      request( app ).put( "/v2/users/update_session" )
        .expect( 401, done );
    } );
    it( "should return JSON with auth", done => {
      nock( "http://localhost:3000" )
        .put( "/users/update_session" )
        .reply( 204 );
      request( app ).put( "/v2/users/update_session" ).set( "Authorization", token )
        .expect( 204, done );
    } );
  } );
} );
