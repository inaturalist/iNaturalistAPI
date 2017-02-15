var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

describe( "routes", function( ) {

  describe( "index", function( ) {
    it( "redirects to /v1/docs", function( done ) {
      request( app ).get( "/" ).
        expect( "Location", "/v1/docs", done);
    });
  });

  describe( "docs", function( ) {
    it( "redirects to /v1/docs", function( done ) {
      request( app ).get( "/docs" ).
        expect( "Location", "/v1/docs", done);
    });
  });

  describe( "swaggerRedirect", function( ) {
    it( "redirects to /v1/swagger.json", function( done ) {
      request( app ).get( "/swagger.json" ).
        expect( "Location", "/v1/swagger.json", done);
    });
  });

  describe( "swaggerJSON", function( ) {
    it( "renders the swagger JSON file", function( done ) {
      request( app ).get( "/v1/swagger.json" ).
        expect( function( res ) {
          expect( res.body.swagger ).to.eq( "2.0" );
          expect( res.body.info.title ).to.eq( "iNaturalist API" );
        }).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "robots", function( ) {
    it( "renders a robots.txt file", function( done ) {
      request( app ).get( "/robots.txt" ).
        expect( function( res ) {
          expect( res.text ).to.eq( "User-agent: *\nAllow: /v1/docs\nDisallow: /" );
        }).expect( "Content-Type", /plain/ ).expect( 200, done );
    });
  });

  describe( "ping", function( ) {
    it( "renders a ping response", function( done ) {
      request( app ).get( "/v1/ping" ).
        expect( function( res ) {
          expect( res.body.status ).to.eq( "available" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

});
