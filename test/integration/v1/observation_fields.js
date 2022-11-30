const { expect } = require( "chai" );
const request = require( "supertest" );

describe( "ObservationFields", ( ) => {
  describe( "autocomplete", ( ) => {
    it( "returns an empty response if not given a query", function ( done ) {
      request( this.app ).get( "/v1/observation_fields/autocomplete" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 0 );
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( 0 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns partial matches", function ( done ) {
      request( this.app ).get( "/v1/observation_fields/autocomplete?q=fieldname" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "fieldname" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
