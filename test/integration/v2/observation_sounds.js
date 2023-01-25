const { expect } = require( "chai" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );

describe( "ObservationSounds", ( ) => {
  const token = jwt.sign( { user_id: 333 },
    config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  const obsSound = {
    id: 123,
    uuid: "dcd68b65-e5ae-4581-8cea-5788cbefe53d",
    observation_id: "c1386ffd-1a87-40f7-b646-b9f716595567"
  };
  describe( "create", ( ) => {
    it( "returns JSON", function ( done ) {
      const stub = { id: 1234, uuid: "b9576748-095f-43e4-ae25-0bb86ec74c47" };
      nock( "http://localhost:3000" )
        .post( "/observation_sounds" )
        .reply( 200, stub );
      request( this.app ).post( "/v2/observation_sounds" )
        .set( "Authorization", token )
        .set( "Content-Type", "multipart/form-data" )
        .field( "fields", "id,uuid" )
        .field( "observation_sound[observation_id]", stub.uuid )
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

  describe( "update", ( ) => {
    it( "returns json", function ( done ) {
      nock( "http://localhost:3000" )
        .put( `/observation_sounds/${obsSound.uuid}` )
        .reply( 200, obsSound );
      request( this.app ).put( `/v2/observation_sounds/${obsSound.uuid}` )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .send( {
          observation_sound: obsSound,
          fields: {
            uuid: true
          }
        } )
        .expect( 200 )
        .expect( res => {
          const resObj = res.body.results[0];
          expect( resObj.uuid ).to.eq( obsSound.uuid );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "delete", ( ) => {
    it( "should not return anything if successful", function ( done ) {
      nock( "http://localhost:3000" )
        .delete( `/observation_sounds/${obsSound.uuid}` )
        .reply( 200 );
      request( this.app ).delete( `/v2/observation_sounds/${obsSound.uuid}` )
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
