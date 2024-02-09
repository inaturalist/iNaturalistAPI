const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const request = require( "supertest" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Projects", ( ) => {
  describe( "membership", ( ) => {
    const project = fixtures.elasticsearch.projects.project[0];
    const token = jwt.sign( { user_id: 333 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    describe( "POST", ( ) => {
      it( "should hit projects/:id/join in the Rails API", function ( done ) {
        nock( "http://localhost:3000" )
          .post( `/projects/${project.id}/join` )
          .reply( 200, {} );
        request( this.app ).post( `/v2/projects/${project.id}/membership` )
          .set( "Authorization", token )
          .expect( 204, done );
      } );
    } );
    describe( "DELETE", ( ) => {
      it( "should hit projects/:id/leave in the Rails API", function ( done ) {
        nock( "http://localhost:3000" )
          .delete( `/projects/${project.id}/leave` )
          .reply( 200, {} );
        request( this.app ).delete( `/v2/projects/${project.id}/membership` )
          .set( "Authorization", token )
          .expect( 204, done );
      } );
    } );
  } );

  describe( "show", ( ) => {
    const project = fixtures.elasticsearch.projects.project[0];
    it( "should retrieve a project", function ( done ) {
      request( this.app ).get( `/v2/projects/${project.id}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results[0].id ).to.eq( project.id );
        } )
        .expect( 200, done );
    } );
    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v2/projects/2023092501?fields=all" )
        .expect( res => {
          const p = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( p.id ).to.eq( 2023092501 );
          expect( p.admins ).not.to.be.undefined;
          expect( p.admins[0] ).not.to.be.undefined;
          expect( p.admins[0].user ).not.to.be.undefined;
          expect( p.admins[0].user.email ).to.be.undefined;
          expect( p.admins[0].user.last_ip ).to.be.undefined;
          expect( p.user ).not.to.be.undefined;
          expect( p.user.email ).to.be.undefined;
          expect( p.user.last_ip ).to.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "search", ( ) => {
    const projects = fixtures.elasticsearch.projects.project;
    it( "returns projects", function ( done ) {
      request( this.app ).get( "/v2/projects" )
        .expect( res => {
          expect( res.body.results.length ).to.eq( _.min( [projects.length, 10] ) );
        } )
        .expect( 200, done );
    } );

    it( "filters by featured", function ( done ) {
      request( this.app ).get( "/v2/projects?featured=true" )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
          expect( res.body.results.length ).to.eq(
            _.filter( projects, p => _.has( p, "site_features" ) ).length
          );
        } )
        .expect( 200, done );
    } );

    it( "orders by featured", function ( done ) {
      request( this.app ).get( "/v2/projects?featured=true&order_by=featured&fields=site_features" )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
          expect( res.body.results.length ).to.eq(
            _.filter( projects, p => _.has( p, "site_features" ) ).length
          );
        } )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v2/projects?q=project-2023092501&fields=all" )
        .expect( res => {
          const project = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( project.id ).to.eq( 2023092501 );
          expect( project.admins ).not.to.be.undefined;
          expect( project.admins[0] ).not.to.be.undefined;
          expect( project.admins[0].user ).not.to.be.undefined;
          expect( project.admins[0].user.email ).to.be.undefined;
          expect( project.admins[0].user.last_ip ).to.be.undefined;
          expect( project.user ).not.to.be.undefined;
          expect( project.user.email ).to.be.undefined;
          expect( project.user.last_ip ).to.be.undefined;
        } )
        .expect( 200, done );
    } );
  } );
} );
