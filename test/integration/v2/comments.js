const { expect } = require( "chai" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );
const app = require( "../../../app" );

describe( "Comments", ( ) => {
  const token = jwt.sign(
    { user_id: 333 },
    config.jwtSecret || "secret",
    { algorithm: "HS512" }
  );
  const c = {
    id: 123,
    uuid: "dcd68b65-e5ae-4581-8cea-5788cbefe53d"
  };
  describe( "create", ( ) => {
    it( "returns JSON", done => {
      nock( "http://localhost:3000" )
        .post( "/comments" )
        .reply( 200, { id: c.id, uuid: c.uuid } );
      request( app ).post( "/v2/comments" )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        // Actual values of what we send don't matter since we're mocking the
        // Rails response, but we need it to pass request schema validation
        .send( {
          comment: {
            parent_type: "Observation",
            parent_id: "cabbd853-39c0-429c-86f1-b36063d3d475",
            body: "this here's a comment"
          }
        } )
        .expect( 200 )
        .expect( res => {
          const resComment = res.body.results[0];
          expect( resComment.uuid ).to.eq( c.uuid );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "update", ( ) => {
    it( "returns updated JSON", done => {
      const newBody = "the new body";
      nock( "http://localhost:3000" )
        .put( `/comments/${c.uuid}` )
        .reply( 200, { id: c.id, uuid: c.uuid, body: newBody } );
      request( app ).put( `/v2/comments/${c.uuid}` )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .send( {
          comment: {
            body: newBody
          },
          fields: {
            body: true
          }
        } )
        .expect( 200 )
        .expect( res => {
          const resComment = res.body.results[0];
          expect( resComment.body ).to.eq( newBody );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "delete", ( ) => {
    it( "should not return anything if successful", done => {
      nock( "http://localhost:3000" )
        .delete( `/comments/${c.uuid}` )
        .reply( 200 );
      request( app ).delete( `/v2/comments/${c.uuid}` )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .expect( 200 )
        .expect( res => {
          expect( res.body ).to.eq( "" );
        } )
        .expect( 200, done );
    } );
  } );
} );
