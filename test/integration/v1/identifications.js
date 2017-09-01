"use strict";
var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

describe( "Identifications", function( ) {

  describe( "search", function( ) {
    it( "should filter by is_change", function( done ) {
      request( app ).get( "/v1/identifications?is_change=false&taxon_id=10002" ).
        expect( function( res ) {
          expect( res.body.results.length ).to.eq( 0 );
        } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  } );

  describe( "recent_taxa", function( ) {
    it( "returns identifications and taxa", function( done ) {
      request( app ).get( "/v1/identifications/recent_taxa" ).
        expect( function( res ) {
          var firstResult = res.body.results[0];
          expect( firstResult.identification ).to.not.be.undefined;
          expect( firstResult.taxon ).to.not.be.undefined;
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "similar_species", function( ) {
    it( "requires a taxon_id", function( done ) {
      request( app ).get( "/v1/identifications/similar_species" ).
        expect( "Content-Type", /json/ ).expect( 422, done );
    });

    it( "returns json", function( done ) {
      request( app ).get( "/v1/identifications/similar_species?taxon_id=5" ).
        expect( function( res ) {
          var firstResult = res.body.results[0];
          expect( firstResult.count ).to.eq( 1 );
          expect( firstResult.taxon ).to.not.be.undefined;
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

});
