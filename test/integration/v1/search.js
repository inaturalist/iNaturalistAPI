const { expect } = require( "chai" );
const request = require( "supertest" );
const _ = require( "lodash" );

describe( "Search", ( ) => {
  describe( "search", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v1/search?q=search+test" ).expect( res => {
        expect( res.body.results.length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns taxa", function ( done ) {
      request( this.app ).get( "/v1/search?q=search+test" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.rank ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns places", function ( done ) {
      request( this.app ).get( "/v1/search?q=search+test" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.bbox_area ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns projects", function ( done ) {
      request( this.app ).get( "/v1/search?q=search+test" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.user_ids ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns users", function ( done ) {
      request( this.app ).get( "/v1/search?q=search+test" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.login ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns substring matches", function ( done ) {
      request( this.app ).get( "/v1/search?q=test+user" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.login === "search_test_user" ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns fuzzy matches", function ( done ) {
      request( this.app ).get( "/v1/search?q=californa" ).expect( res => {
        expect( res.body.results.length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "does not return spam projects", function ( done ) {
      request( this.app ).get( "/v1/search?q=spammiest+spam+project" ).expect( res => {
        expect( res.body.results.length ).to.eq( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
