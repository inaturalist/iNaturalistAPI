const { expect } = require( "chai" );
const request = require( "supertest" );
const iNaturalistAPI = require( "../../../lib/inaturalist_api" );

const app = iNaturalistAPI.server( );

describe( "Users", ( ) => {
  describe( "show", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/users/5" )
        .expect( res => {
          const user = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( user.id ).to.eq( 5 );
          expect( user.login ).to.eq( "b-user" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    // takes an id or a login
    it( "accepts a login in place of an ID", done => {
      request( app ).get( "/v1/users/b-user" )
        .expect( res => {
          const user = res.body.results[0];
          expect( user.id ).to.eq( 5 );
          expect( user.login ).to.eq( "b-user" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns a 422 for unknown users", done => {
      request( app ).get( "/v1/users/123123" )
        .expect( "Content-Type", /json/ ).expect( 422, done );
    } );
  } );

  describe( "autocomplete", ( ) => {
    it( "returns an empty response if not given a query", done => {
      request( app ).get( "/v1/users/autocomplete" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 0 );
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( 0 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns partial matches", done => {
      request( app ).get( "/v1/users/autocomplete?q=userlogin" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].login ).to.eq( "userlogin" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "projects", ( ) => {
    it( "returns a 422 for unknown users", done => {
      request( app ).get( "/v1/users/nobody/projects" )
        .expect( "Content-Type", /json/ ).expect( 422, done );
    } );

    it( "returns projects given a user ID", done => {
      request( app ).get( "/v1/users/1/projects" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 2 );
          expect( res.body.total_results ).to.eq( 2 );
          expect( res.body.results[0].slug ).to.eq( "project-one" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns projects given a user login", done => {
      request( app ).get( "/v1/users/userlogin/projects" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 2 );
          expect( res.body.total_results ).to.eq( 2 );
          expect( res.body.results[0].slug ).to.eq( "project-one" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
