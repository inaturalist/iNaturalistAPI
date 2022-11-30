const { expect } = require( "chai" );
const request = require( "supertest" );
const fs = require( "fs" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "ControlledTerms", ( ) => {
  describe( "search", ( ) => {
    it( "returns JSON", function ( done ) {
      request( this.app ).get( "/v2/controlled_terms" )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.greaterThan( 0 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
  describe( "for_taxon", ( ) => {
    it( "returns JSON", function ( done ) {
      const taxon = fixtures.elasticsearch.taxa.taxon[1];
      request( this.app ).get( `/v2/controlled_terms/for_taxon/${taxon.uuid}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.greaterThan( 0 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns JSON for multiple taxa", function ( done ) {
      const t1 = fixtures.elasticsearch.taxa.taxon[1];
      const t2 = fixtures.elasticsearch.taxa.taxon[2];
      request( this.app ).get( `/v2/controlled_terms/for_taxon/${t1.uuid},${t2.uuid}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.greaterThan( 0 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns JSON for multiple taxa specified by UUID and ID", function ( done ) {
      const t1 = fixtures.elasticsearch.taxa.taxon[1];
      const t2 = fixtures.elasticsearch.taxa.taxon[2];
      request( this.app ).get( `/v2/controlled_terms/for_taxon/${t1.id},${t2.uuid}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.greaterThan( 0 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
