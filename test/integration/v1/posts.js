const { expect } = require( "chai" );
const jwt = require( "jsonwebtoken" );
const request = require( "supertest" );
const nock = require( "nock" );
const config = require( "../../../config" );

describe( "posts", ( ) => {
  const token = jwt.sign(
    { user_id: 1 },
    config.jwtSecret || "secret",
    { algorithm: "HS512" }
  );

  describe( "for_user", ( ) => {
    it( "returns posts", function ( done ) {
      nock( "http://localhost:3000" )
        .get( "/posts/for_user" )
        .reply( 200, [{ id: 1 }] );
      request( this.app ).get( "/v1/posts/for_user" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          expect( res.body.length ).to.eq( 1 );
          expect( res.body[0].id ).to.eq( 1 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
