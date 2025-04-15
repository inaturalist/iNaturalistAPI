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
    it( "returns user by orcid", function ( done ) {
      request( this.app ).get( "/v1/search?q=0000-0001-0002-0004" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.login === "a-user" ).length ).to.be.above( 0 );
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
    it( "general search by integer returns 2 classes by id and 1 project by name", function ( done ) {
      request( this.app ).get( "/v1/search?q=696" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 3 );
          expect( res.body.results[0].record.id ).to.eq( 696 );
          expect( res.body.results[1].record.id ).to.eq( 696 );
          expect( res.body.results[2].record.title ).to.eq( "Project 696" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "does not return spam projects", function ( done ) {
      request( this.app ).get( "/v1/search?q=spammiest+spam+project" ).expect( res => {
        expect( res.body.results.length ).to.eq( 0 );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user", function ( done ) {
      request( this.app ).get( "/v1/search?q=User2023092501" ).expect( res => {
        const user = res.body.results[0];
        expect( user.type ).to.eq( "User" );
        expect( user.record ).not.to.be.undefined;
        expect( user.record.id ).to.eq( 2023092501 );
        expect( user.record.email ).to.be.undefined;
        expect( user.record.last_ip ).to.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v1/search?q=project-2023092501" ).expect( res => {
        const project = res.body.results[0];
        expect( project.type ).to.eq( "Project" );
        expect( project.record ).not.to.be.undefined;
        expect( project.record.id ).to.eq( 2023092501 );
        expect( project.record.admins ).not.to.be.undefined;
        expect( project.record.admins[0] ).not.to.be.undefined;
        expect( project.record.admins[0].email ).to.be.undefined;
        expect( project.record.admins[0].last_ip ).to.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
