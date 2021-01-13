const { expect } = require( "chai" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config.js" );
const app = require( "../../../app" );

describe.only( "ObservationSounds", ( ) => {
  const token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  const obsSound = {
    id: 123,
    uuid: "dcd68b65-e5ae-4581-8cea-5788cbefe53d",
    position: 0
  };
  describe( "create", ( ) => {
    it( "returns JSON", done => {
      const stub = { id: 1234, uuid: "b9576748-095f-43e4-ae25-0bb86ec74c47" };
      nock( "http://localhost:3000" )
        .post( "/observation_sounds" )
        .reply( 200, stub );
      request( app ).post( "/v2/observation_sounds" )
        .set( "Authorization", token )
        .set( "Content-Type", "multipart/form-data" )
        .field( "fields", "id,uuid" )
        // It's supposed to accept a file, but since we're just stubbing the
        // rails response, it doesn't really matter what file
        .attach( "file", "test/fixtures/cuthona_abronia-tagged.jpg" )
        .expect( 200 )
        .expect( res => {
          const resObj = res.body.results[0];
          expect( resObj.uuid ).to.eq( stub.uuid );
          expect( resObj.id ).to.eq( stub.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "delete", ( ) => {
    it( "should not return anything if successful", done => {
      nock( "http://localhost:3000" )
        .delete( `/observation_sounds/${obsSound.uuid}` )
        .reply( 200 );
      request( app ).delete( `/v2/observation_sounds/${obsSound.uuid}` )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .expect( 200 )
        .expect( res => {
          expect( res.body ).to.eq( "" );
        } )
        .expect( 200, done );
    } );
  } );
} );
