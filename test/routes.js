var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    util = require( "../lib/routes" ),
    iNaturalistAPI = require( "../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

describe( "routes", function( ) {

  describe( "index", function( ) {
    it( "shows the app name", function( done ) {
      request( app ).get( "/" ).
        expect( "Content-Type", /text\/html/ ).
        expect( "iNaturalist API" ).
        expect( 200, done );
    })
  });

});
