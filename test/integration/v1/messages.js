const { expect } = require( "chai" );
const request = require( "supertest" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const fs = require( "fs" );
const config = require( "../../../config.js" );
const iNaturalistAPI = require( "../../../lib/inaturalist_api" );

const app = iNaturalistAPI.server( );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe.only( "Messages", ( ) => {
  const currentUser = fixtures.elasticsearch.users.user[0];
  const token = jwt.sign( { user_id: currentUser.id }, config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  const fromUser = currentUser;
  const toUser = fixtures.elasticsearch.users.user[1];

  describe( "index", ( ) => {
    it( "should fill in from_user", done => {
      nock( "http://localhost:3000" )
        .get( "/messages" )
        .reply( 200, { results: [{ id: 1, from_user_id: fromUser.id, to_user_id: toUser.id }] } );
      request( app ).get( "/v1/messages" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].from_user.id ).to.eq( fromUser.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "should fill in to_user", done => {
      nock( "http://localhost:3000" )
        .get( "/messages" )
        .reply( 200, { results: [{ id: 1, from_user_id: fromUser.id, to_user_id: toUser.id }] } );
      request( app ).get( "/v1/messages" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.results[0].to_user.id ).to.eq( toUser.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "show", ( ) => {
    it( "should fill in reply_to_user", done => {
      nock( "http://localhost:3000" )
        .get( "/messages/1" )
        .reply( 200, {
          reply_to_user_id: toUser.id,
          results: [{ id: 1, from_user_id: fromUser.id, to_user_id: toUser.id }]
        } );
      request( app ).get( "/v1/messages/1" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.reply_to_user.id ).to.eq( toUser.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "unread", ( ) => {
    it( "should show the number of unread messages", done => {
      nock( "http://localhost:3000" )
        .get( "/messages/count" )
        .reply( 200, {
          count: 2
        } );
      request( app ).get( "/v1/messages/unread" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.count ).to.eq( 2 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "create", ( ) => {
    it( "should succeed", done => {
      nock( "http://localhost:3000" )
        .post( "/messages" )
        .reply( 200, { id: 1 } );
      request( app ).post( "/v1/messages" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.id ).to.eq( 1 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "delete", ( ) => {
    it( "should succeed", done => {
      nock( "http://localhost:3000" )
        .delete( "/messages/1" )
        .reply( 200, {} );
      request( app ).delete( "/v1/messages/1" ).set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
