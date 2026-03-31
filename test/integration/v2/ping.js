const { expect } = require( "chai" );
const request = require( "supertest" );

describe( "Ping", ( ) => {
  describe( "index", ( ) => {
    it( "renders a ping response", function ( done ) {
      request( this.app ).get( "/v2/ping" )
        .expect( res => {
          expect( res.body.status ).to.eq( "available" );
          expect( res.headers["cache-control"] ).to.eq(
            "private, no-cache, no-store, must-revalidate"
          );
          expect( res.headers.expires ).to.eq( "-1" );
          expect( res.headers.pragma ).to.eq( "no-cache" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
