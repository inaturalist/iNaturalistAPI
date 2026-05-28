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
    it( "uses the returned X-Total-Entries header for total_results", function ( done ) {
      nock( "http://localhost:3000" )
        .get( "/posts/for_user?page=1&per_page=30" )
        .reply( 200, [{ id: 1 }], {
          "X-Total-Entries": 99
        } );
      request( this.app ).get( "/v2/posts/for_user" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 99 );
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 30 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].id ).to.eq( 1 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
