const { expect } = require( "chai" );
const request = require( "supertest" );
const _ = require( "lodash" );

describe( "Search", ( ) => {
  describe( "search", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v2/search?q=search+test&fields=all" ).expect( res => {
        expect( res.body.results.length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns taxa", function ( done ) {
      request( this.app ).get( "/v2/search?q=search+test&fields=all" ).expect( res => {
        expect( _.filter( res.body.results, r => r?.taxon?.rank ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns places", function ( done ) {
      request( this.app ).get( "/v2/search?q=search+test&fields=all" ).expect( res => {
        expect( _.filter( res.body.results, r => r?.place?.bbox_area ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns projects", function ( done ) {
      request( this.app ).get( "/v2/search?q=search+test&fields=all" ).expect( res => {
        expect( _.filter( res.body.results, r => r?.project?.user_ids ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns users", function ( done ) {
      request( this.app ).get( "/v2/search?q=search+test&fields=all" ).expect( res => {
        expect( _.filter( res.body.results, r => r?.user?.login ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns user by orcid", function ( done ) {
      request( this.app ).get( "/v2/search?q=0000-0001-0002-0004&fields=all" ).expect( res => {
        expect( _.filter( res.body.results, r => r?.user?.login === 'a-user').length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns substring matches", function ( done ) {
      request( this.app ).get( "/v2/search?q=test+user&fields=all" ).expect( res => {
        expect( _.filter( res.body.results, r => r?.user?.login === "search_test_user" ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "returns fuzzy matches", function ( done ) {
      request( this.app ).get( "/v2/search?q=californa&fields=all" ).expect( res => {
        expect( res.body.results.length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "does not return spam projects", function ( done ) {
      request( this.app ).get( "/v2/search?q=spammiest+spam+project&fields=all" ).expect( res => {
        expect( res.body.results.length ).to.eq( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
