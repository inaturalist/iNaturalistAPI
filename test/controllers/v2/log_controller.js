const request = require( "supertest" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );

const token = jwt.sign(
  { user_id: 123 },
  config.jwtSecret || "secret",
  { algorithm: "HS512" }
);

describe( "LogController", ( ) => {
  describe( "get", ( ) => {
    // it( "should succeed with auth", done => {
    //   request( this.app ).get( "/v2/log" )
    //     .set( "Authorization", token )
    //     .set( "Content-Type", "application/json" )
    //     .expect( 200, done );
    // } );
    // it.todo( "should fail without auth" );
    // it.todo( "should succeed without auth if origin is www.inaturalist.org" );
  } );
  describe( "post", ( ) => {
    // it.todo( "should succeed with auth" );
    // it.todo( "should fail without auth" );
    // it.todo( "should succeed without auth if origin is www.inaturalist.org" );
    // expect Logstasher.logWriteStream( ).tobecalled with the payload
  } );
} );
