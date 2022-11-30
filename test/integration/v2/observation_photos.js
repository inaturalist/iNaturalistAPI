const { expect } = require( "chai" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );

describe( "ObservationPhotos", ( ) => {
  describe( "create", ( ) => {
    it( "returns JSON", function ( done ) {
      const token = jwt.sign( { user_id: 333 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      const stub = { id: 1234, uuid: "b9576748-095f-43e4-ae25-0bb86ec74c47" };
      nock( "http://localhost:3000" )
        .post( "/observation_photos" )
        .reply( 200, stub );
      request( this.app ).post( "/v2/observation_photos" )
        .set( "Authorization", token )
        .set( "Content-Type", "multipart/form-data" )
        .field( "fields", "id,uuid" )
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
} );
