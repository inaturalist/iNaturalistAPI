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
        expect( _.filter( res.body.results, r => r?.user?.login === "a-user" ).length ).to.be.above( 0 );
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

    it( "never returns email or IP for user", function ( done ) {
      request( this.app ).get( "/v2/search?q=User2023092501&fields=all" ).expect( res => {
        const record = res.body.results[0];
        expect( record.type ).to.eq( "user" );
        expect( record.user ).not.to.be.undefined;
        expect( record.user.id ).to.eq( 2023092501 );
        expect( record.user.email ).to.be.undefined;
        expect( record.user.last_ip ).to.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v2/search?q=project-2023092501&fields=all" ).expect( res => {
        const record = res.body.results[0];
        expect( record.type ).to.eq( "project" );
        expect( record.project ).not.to.be.undefined;
        expect( record.project.id ).to.eq( 2023092501 );
        expect( record.project.admins ).not.to.be.undefined;
        expect( record.project.admins[0] ).not.to.be.undefined;
        expect( record.project.admins[0].email ).to.be.undefined;
        expect( record.project.admins[0].last_ip ).to.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
