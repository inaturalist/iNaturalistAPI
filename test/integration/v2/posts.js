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

  describe( "show", ( ) => {
    it( "returns a post in a results object", function ( done ) {
      nock( "http://localhost:3000" )
        .get( "/posts/1?fields=all" )
        .reply( 200, { id: 1, user: { id: 1 } } );
      request( this.app ).get( "/v2/posts/1?fields=all" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.results[0].id ).to.eq( 1 );
          expect( res.body.results[0].user.login ).to.eq( "userlogin" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not forward authorization to Rails", function ( done ) {
      nock( "http://localhost:3000", { badheaders: ["Authorization"] } )
        .get( "/posts/1" )
        .reply( 200, { id: 1 } );
      request( this.app ).get( "/v2/posts/1" )
        .set( "Authorization", token )
        .expect( 200, done );
    } );

    it( "returns 404 when Rails returns 404", function ( done ) {
      nock( "http://localhost:3000" )
        .get( "/posts/1" )
        .reply( 404, { error: "Not found" } );
      request( this.app ).get( "/v2/posts/1" )
        .expect( 404, done );
    } );

    it( "accepts an id with a slug", function ( done ) {
      nock( "http://localhost:3000" )
        .get( "/posts/1-some-title" )
        .reply( 200, { id: 1 } );
      request( this.app ).get( "/v2/posts/1-some-title" )
        .expect( res => {
          expect( res.body.results[0].id ).to.eq( 1 );
        } )
        .expect( 200, done );
    } );

    it( "returns 422 for an id that does not start with an integer", function ( done ) {
      request( this.app ).get( "/v2/posts/abc" )
        .expect( 422, done );
    } );

    it( "returns 422 for a slug with characters outside a parameterized title", function ( done ) {
      request( this.app ).get( "/v2/posts/1-some.title" )
        .expect( 422, done );
    } );
  } );
} );
