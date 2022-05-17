const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );
const app = require( "../../../app" );

describe( "Sounds", ( ) => {
  const token = jwt.sign( { user_id: 333 },
    config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  describe( "create", ( ) => {
    it( "returns JSON", done => {
      nock( "http://localhost:3000" )
        .post( "/sounds" )
        .reply( 200 );
      request( app ).post( "/v2/sounds" )
        .set( "Authorization", token )
        .set( "Content-Type", "multipart/form-data" )
        // It's supposed to accept a file, but since we're just stubbing the
        // rails response, it doesn't really matter what file
        .attach( "file", "test/fixtures/cuthona_abronia-tagged.jpg" )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
