const _ = require( "lodash" );
const { expect } = require( "chai" );
const request = require( "supertest" );
const fs = require( "fs" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "ControlledTerms", ( ) => {
  describe( "search", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v1/controlled_terms" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  } );

  describe( "forTaxon", ( ) => {
    it( "requires a taxon_id param", function ( done ) {
      request( this.app ).get( "/v1/controlled_terms/for_taxon" )
        .expect( res => {
          expect( res.body.status ).to.eq( 422 );
        } ).expect( "Content-Type", /json/ )
        .expect( 422, done );
    } );

    it( "returns controlled terns", function ( done ) {
      const fixtureTerms = fixtures.elasticsearch.controlled_terms.controlled_term;
      request( this.app ).get( "/v1/controlled_terms/for_taxon?taxon_id=11" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( _.filter( fixtureTerms, t => t.is_value === "true" ).length );
          expect( res.body.results[0].id ).to.eq( 1 );
          expect( res.body.results[0].is_value ).to.eq( "false" );
          expect( res.body.results[0].uri ).to.not.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
