const { expect } = require( "chai" );
const request = require( "supertest" );

describe( "ElasticMapper", ( ) => {
  describe( "validation", ( ) => {
    it( "accepts the .png format", function ( done ) {
      request( this.app ).get( "/v1/grid/1/0/0.png" ).expect( 200 )
        .expect( "content-type", "image/png", done );
    } );

    it( "accepts the .grid.json format", function ( done ) {
      request( this.app ).get( "/v1/grid/1/1/1.grid.json" ).expect( 200 )
        .expect( "content-type", "application/json; charset=utf-8", done );
    } );

    it( "renders .torque.json", function ( done ) {
      request( this.app ).get( "/v1/grid/1/0/0.torque.json" )
        .expect( res => {
          expect( res.text ).to.include( "x__uint8" );
          expect( res.text ).to.include( "y__uint8" );
          expect( res.text ).to.include( "vals__uint8" );
        } )
        .expect( 200 )
        .expect( "content-type", "text/html; charset=utf-8", done );
    } );

    it( "errors on all other formats format", function ( done ) {
      request( this.app ).get( "/v1/grid/1/0/0.html" ).expect( 404 )
        .expect( "Invalid format", done );
    } );

    it( "returns an error for an unknown style", function ( done ) {
      request( this.app ).get( "/v1/nonsense/1/0/0.png" ).expect( 404 )
        .expect( "unknown style: nonsense", done );
    } );

    it( "zoom must be 0 or above", function ( done ) {
      request( this.app ).get( "/v1/grid/-1/0/0.png" ).expect( 404 )
        .expect( "Invalid zoom", done );
    } );

    it( "zoom must be 21 or below", function ( done ) {
      request( this.app ).get( "/v1/grid/22/0/0.png" ).expect( 404 )
        .expect( "Invalid zoom", done );
    } );

    it( "x must be 0 or above", function ( done ) {
      request( this.app ).get( "/v1/grid/5/-1/0.png" ).expect( 404 )
        .expect( "Invalid x value", done );
    } );

    it( "x must be within range", function ( done ) {
      request( this.app ).get( "/v1/grid/5/32/0.png" ).expect( 404 )
        .expect( "Invalid x value", done );
    } );

    it( "y must be 0 or above", function ( done ) {
      request( this.app ).get( "/v1/grid/5/0/-1.png" ).expect( 404 )
        .expect( "Invalid y value", done );
    } );

    it( "y must be within range", function ( done ) {
      request( this.app ).get( "/v1/grid/5/0/32.png" ).expect( 404 )
        .expect( "Invalid y value", done );
    } );

    it( "y must be within range", function ( done ) {
      request( this.app ).get( "/v1/grid/5/0/32.png" ).expect( 404 )
        .expect( "Invalid y value", done );
    } );
  } );
} );
