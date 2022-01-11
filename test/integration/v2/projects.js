const { expect } = require( "chai" );
const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const request = require( "supertest" );
const config = require( "../../../config.js" );
const app = require( "../../../app" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Projects", ( ) => {
  describe( "membership", ( ) => {
    const project = fixtures.elasticsearch.projects.project[0];
    const token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    describe( "POST", ( ) => {
      it( "should hit projects/:id/join in the Rails API", done => {
        nock( "http://localhost:3000" )
          .post( `/projects/${project.id}/join` )
          .reply( 200, {} );
        request( app ).post( `/v2/projects/${project.id}/membership` )
          .set( "Authorization", token )
          .expect( 204, done );
      } );
    } );
    describe( "DELETE", ( ) => {
      it( "should hit projects/:id/leave in the Rails API", done => {
        nock( "http://localhost:3000" )
          .delete( `/projects/${project.id}/leave` )
          .reply( 200, {} );
        request( app ).delete( `/v2/projects/${project.id}/membership` )
          .set( "Authorization", token )
          .expect( 204, done );
      } );
    } );
  } );
  describe( "show", ( ) => {
    const project = fixtures.elasticsearch.projects.project[0];
    it( "should retrieve a project", done => {
      request( app ).get( `/v2/projects/${project.id}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results[0].id ).to.eq( project.id );
        } )
        .expect( 200, done );
    } );
  } );
} );
