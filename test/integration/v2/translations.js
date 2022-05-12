const request = require( "supertest" );
const nock = require( "nock" );
const app = require( "../../../app" );

describe( "Translations", ( ) => {
  describe( "locales", ( ) => {
    it( "returns json", done => {
      const nockScope = nock( "http://localhost:3000" )
        .get( "/translations/locales?fields=locale%2Clanguage_in_locale" )
        .reply( 200, {} );
      request( app )
        .get( "/v2/translations/locales" )
        .expect( ( ) => {
          // Raise an exception if the nocked endpoint doesn't get called
          nockScope.done( );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
