const { expect } = require( "chai" );
const request = require( "supertest" );

describe( "ExemplarIdentifications", ( ) => {
  describe( "search", ( ) => {
    it( "returns JSON", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications" )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.be.above( 1 );
          expect( res.body.results.length ).to.eq( res.body.total_results );
        } )
        .expect( 200, done );
    } );

    it( "can include include category_counts", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=3&include_category_counts=true" )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.category_counts ).to.be.an( "object" );
        } )
        .expect( 200, done );
    } );

    it( "can include include category_controlled_terms", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?include_category_controlled_terms=true" )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.category_controlled_terms ).to.be.an( "array" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by upvoted", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=3&upvoted=true&fields=all" )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 3 upvoted" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by downvoted", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=3&downvoted=true&fields=all" )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 3 downvoted" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by nominated", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=7&nominated=true&fields=all" )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 7 nominated" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by not nominated", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=7&nominated=false&fields=all" )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 7 unnominated" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by term_value_id", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=3&term_value_id=2&fields=all" )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 3 annotated" );
        } )
        .expect( 200, done );
    } );

    describe( "q", ( ) => {
      it( "can filter by query", function ( done ) {
        request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=7&q=unnominated&fields=all" )
          .set( "Content-Type", "application/json" )
          .expect( "Content-Type", /json/ )
          .expect( res => {
            expect( res.body.total_results ).to.eq( 1 );
            expect( res.body.results.length ).to.eq( 1 );
            expect( res.body.results[0].identification.body ).to.eq( "taxon 7 unnominated" );
          } )
          .expect( 200, done );
      } );

      it( "can filter by user login", function ( done ) {
        request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=7&q=user121&fields=all" )
          .set( "Content-Type", "application/json" )
          .expect( "Content-Type", /json/ )
          .expect( res => {
            expect( res.body.total_results ).to.eq( 1 );
            expect( res.body.results.length ).to.eq( 1 );
            expect( res.body.results[0].identification.user.login ).to.eq( "user121" );
          } )
          .expect( 200, done );
      } );

      it( "can filter by query and user login", function ( done ) {
        request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=7&q=unnominated user121&fields=all" )
          .set( "Content-Type", "application/json" )
          .expect( "Content-Type", /json/ )
          .expect( res => {
            expect( res.body.total_results ).to.eq( 1 );
            expect( res.body.results.length ).to.eq( 1 );
            expect( res.body.results[0].identification.user.login ).to.eq( "user121" );
          } )
          .expect( 200, done );
      } );

      it( "can filter by partial query", function ( done ) {
        request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=3&q=upvo&fields=all" )
          .set( "Content-Type", "application/json" )
          .expect( "Content-Type", /json/ )
          .expect( res => {
            expect( res.body.total_results ).to.eq( 1 );
            expect( res.body.results.length ).to.eq( 1 );
            res.body.results.forEach( result => {
              expect( result.identification.body ).to.include( "upvoted" );
            } );
          } )
          .expect( 200, done );
      } );

      it( "can filter by partial query and user login", function ( done ) {
        request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=7&q=nom user12&fields=all" )
          .set( "Content-Type", "application/json" )
          .expect( "Content-Type", /json/ )
          .expect( res => {
            expect( res.body.total_results ).to.eq( 2 );
            expect( res.body.results.length ).to.eq( 2 );
            res.body.results.forEach( result => {
              expect( result.identification.user.login ).to.be.oneOf( ["user121", "user122"] );
            } );
          } )
          .expect( 200, done );
      } );
    } );
  } );
} );
