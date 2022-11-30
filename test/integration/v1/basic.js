const { expect } = require( "chai" );
const request = require( "supertest" );

describe( "routes", ( ) => {
  describe( "index", ( ) => {
    it( "redirects to /v1/docs", function ( done ) {
      request( this.app ).get( "/" )
        .expect( "Location", "/v1/docs", done );
    } );
  } );

  describe( "docs", ( ) => {
    it( "redirects to /v1/docs", function ( done ) {
      request( this.app ).get( "/docs" )
        .expect( "Location", "/v1/docs", done );
    } );
  } );

  describe( "swaggerRedirect", ( ) => {
    it( "redirects to /v1/swagger.json", function ( done ) {
      request( this.app ).get( "/swagger.json" )
        .expect( "Location", "/v1/swagger.json", done );
    } );
  } );

  describe( "swaggerJSON", ( ) => {
    it( "renders the swagger JSON file", function ( done ) {
      request( this.app ).get( "/v1/swagger.json" )
        .expect( res => {
          expect( res.body.swagger ).to.eq( "2.0" );
          expect( res.body.info.title ).to.eq( "iNaturalist API" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "robots", ( ) => {
    it( "renders a robots.txt file", function ( done ) {
      request( this.app ).get( "/robots.txt" )
        .expect( res => {
          expect( res.text ).to.eq( "User-agent: *\nAllow: /v1/docs\nDisallow: /" );
        } ).expect( "Content-Type", /plain/ )
        .expect( 200, done );
    } );
  } );

  describe( "ping", ( ) => {
    it( "renders a ping response", function ( done ) {
      request( this.app ).get( "/v1/ping" )
        .expect( res => {
          expect( res.body.status ).to.eq( "available" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
