const { expect } = require( "chai" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );

describe( "Photos", ( ) => {
  describe( "create", ( ) => {
    it( "returns JSON", function ( done ) {
      const token = jwt.sign( { user_id: 333 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      const stub = { id: 1234 };
      nock( "http://localhost:3000" )
        .post( "/photos" )
        .reply( 200, stub );
      request( this.app ).post( "/v2/photos" )
        .set( "Authorization", token )
        .set( "Content-Type", "multipart/form-data" )
        .attach( "file", "test/fixtures/cuthona_abronia-tagged.jpg" )
        .expect( res => {
          const resObj = res.body.results[0];
          expect( resObj.id ).to.eq( stub.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "update", ( ) => {
    it( "returns JSON", function ( done ) {
      const token = jwt.sign( { user_id: 333 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      const stub = { id: 1234 };
      nock( "http://localhost:3000" )
        .put( `/photos/${stub.id}` )
        .reply( 200, stub );
      request( this.app ).put( `/v2/photos/${stub.id}` )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .send( { license_code: "cc-by" } )
        .expect( 200 )
        .expect( res => {
          const resPhotto = res.body.results[0];
          expect( resPhotto.id ).to.eq( stub.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
