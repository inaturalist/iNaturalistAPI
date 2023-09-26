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
  } );
} );
