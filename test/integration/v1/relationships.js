const { expect } = require( "chai" );
const _ = require( "lodash" );
const fs = require( "fs" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config.js" );
const app = require( "../../../app" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Relationships", ( ) => {
  const userId = fixtures.postgresql.friendships[0].user_id;
  const token = jwt.sign( { user_id: userId }, config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  describe( "index", ( ) => {
    it( "should return JSON", done => {
      request( app ).get( "/v1/relationships" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( response => {
          expect( response.body.results.length ).to.be.above( 0 );
          expect( response.body.results[0].friend_user.login ).to.not.be.undefined;
        } )
        .expect( 200, done );
    } );
    it( "should return reciprocal_trust", done => {
      const trustingFollowedFriendship = _.find(
        fixtures.postgresql.friendships,
        f => f.friend_id === userId && f.trust
      );
      expect( trustingFollowedFriendship ).not.to.be.undefined;
      request( app ).get( "/v1/relationships" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( response => {
          const relat = _.find( response.body.results,
            r => r.friend_user.id === trustingFollowedFriendship.user_id );
          expect( relat.reciprocal_trust ).to.be.true;
        } )
        .expect( 200, done );
    } );
  } );
  describe( "create", ( ) => {
    it( "should succeed", done => {
      nock( "http://localhost:3000" )
        .post( "/relationships" )
        .reply( 200, { id: 1 } );
      request( app ).post( "/v1/relationships" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.id ).to.eq( 1 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
  describe( "update", ( ) => {
    it( "should succeed", done => {
      nock( "http://localhost:3000" )
        .put( "/relationships/1" )
        .reply( 200, {} );
      request( app ).put( "/v1/relationships/1" ).set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
  describe( "delete", ( ) => {
    it( "should succeed", done => {
      nock( "http://localhost:3000" )
        .delete( "/relationships/1" )
        .reply( 200, {} );
      request( app ).delete( "/v1/relationships/1" ).set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
