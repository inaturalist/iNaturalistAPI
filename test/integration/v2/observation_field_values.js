// const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const request = require( "supertest" );
const config = require( "../../../config.js" );
const app = require( "../../../app" );

describe( "/observation_field_values", ( ) => {
  const token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
    { algorithm: "HS512" } );

  describe( "POST", ( ) => {
    it( "should request create from Rails", done => {
      nock( "http://localhost:3000" )
        .post( "/observation_field_values" )
        .reply( 200, { } );
      request( app ).post( "/v2/observation_field_values" )
        .set( "Authorization", token )
        .expect( 200, done );
    } );
  } );

  describe( "/:uuid", ( ) => {
    describe( "DELETE", ( ) => {
      it( "should request delete from Rails", done => {
        const ofv = { uuid: "48fba6f4-8627-411b-bf38-af9e280e5cfc" };
        nock( "http://localhost:3000" )
          .delete( `/observation_field_values/${ofv.uuid}` )
          .reply( 200, { } );
        request( app ).delete( `/v2/observation_field_values/${ofv.uuid}` )
          .set( "Authorization", token )
          .expect( 204, done );
      } );
    } );
  } );
} );
