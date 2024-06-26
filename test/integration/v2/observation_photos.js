const { expect } = require( "chai" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );

describe( "ObservationPhotos", ( ) => {
  const token = jwt.sign( { user_id: 333 },
    config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  const obsPhoto = {
    id: 1234,
    uuid: "b9576748-095f-43e4-ae25-0bb86ec74c47",
    observation_id: "c1386ffd-1a87-40f7-b646-b9f716595567",
    position: 1
  };

  describe( "create", ( ) => {
    beforeEach( ( ) => {
      nock( "http://localhost:3000" )
        .post( "/observation_photos" )
        .reply( 200, obsPhoto );
    } );
    describe( "with a new photo", ( ) => {
      it( "returns JSON", function ( done ) {
        request( this.app ).post( "/v2/observation_photos" )
          .set( "Authorization", token )
          .set( "Content-Type", "multipart/form-data" )
          .field( "fields", "id,uuid,position" )
          .field( "observation_photo[observation_id]", obsPhoto.observation_id )
          .field( "observation_photo[position]", 1 )
          .attach( "file", "test/fixtures/cuthona_abronia-tagged.jpg" )
          .expect( 200 )
          .expect( res => {
            // NOTE: these properties are just what was stubbed with `const obsPhoto` above, so
            // this just tests that the endpoint was hit without error and returned what we
            // instructed it to return
            const resObj = res.body.results[0];
            expect( resObj.uuid ).to.eq( obsPhoto.uuid );
            expect( resObj.id ).to.eq( obsPhoto.id );
            expect( resObj.position ).to.eq( obsPhoto.position );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );

    describe( "with an existing photo", ( ) => {
      it( "accepts a UUID", function ( done ) {
        request( this.app ).post( "/v2/observation_photos" )
          .set( "Authorization", token )
          .set( "Content-Type", "multipart/form-data" )
          .set( "Content-Type", "application/json" )
          .send( {
            observation_photo: {
              observation_id: obsPhoto.observation_id,
              photo_id: 123,
              uuid: obsPhoto.uuid,
              position: 2
            }
          } )
          .expect( 200, done );
      } );
    } );
  } );

  describe( "update", ( ) => {
    it( "returns json", function ( done ) {
      nock( "http://localhost:3000" )
        .put( `/observation_photos/${obsPhoto.uuid}` )
        .reply( 200, obsPhoto );
      request( this.app ).put( `/v2/observation_photos/${obsPhoto.uuid}` )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .send( {
          observation_photo: obsPhoto,
          fields: {
            uuid: true
          }
        } )
        .expect( 200 )
        .expect( res => {
          const resObj = res.body.results[0];
          expect( resObj.uuid ).to.eq( obsPhoto.uuid );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "delete", ( ) => {
    it( "should not return anything if successful", function ( done ) {
      nock( "http://localhost:3000" )
        .delete( `/observation_photos/${obsPhoto.uuid}` )
        .reply( 200 );
      request( this.app ).delete( `/v2/observation_photos/${obsPhoto.uuid}` )
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
