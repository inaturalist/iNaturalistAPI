"use strict";

var request = require( "supertest" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

describe( "ControlledTerms", ( ) => {
  describe( "search", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/controlled_terms" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  } );
} );