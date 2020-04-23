const { expect } = require( "chai" );
const request = require( "supertest" );
const app = require( "../../../openapi_app" );

describe( "Identifications", ( ) => {
  describe( "identifiers", ( ) => {
    it( "return JSON", done => {
      request( app ).get( "/v2/identifications/identifiers" )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.greaterThan( 0 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
