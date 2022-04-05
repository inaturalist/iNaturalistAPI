const { expect } = require( "chai" );
const request = require( "supertest" );
const app = require( "../../../app" );

describe( "Sites", ( ) => {
  describe( "index", ( ) => {
    it( "should return JSON", done => {
      request( app ).get( "/v2/sites?fields=all" )
        .expect( 200 )
        .expect( response => {
          expect( response.body.results.length ).to.be.above( 0 );
          const site = response.body.results[0];
          const attrs = [
            "id",
            "name",
            "url",
            "place_id",
            "locale",
            "site_name_short",
            "icon_url"
          ];
          for ( let i = attrs.length - 1; i >= 0; i -= 1 ) {
            expect( site[attrs[i]] ).to.not.be.undefined;
          }
        } )
        .expect( 200, done );
    } );
  } );
} );
