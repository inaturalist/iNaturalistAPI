const { expect } = require( "chai" );
const _ = require( "lodash" );
const fs = require( "fs" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );
const app = require( "../../../app" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Relationships", ( ) => {
  const userId = fixtures.postgresql.friendships[0].user_id;
  const token = jwt.sign(
    { user_id: userId },
    config.jwtSecret || "secret",
    { algorithm: "HS512" }
  );
  describe( "index", ( ) => {
    it( "should return JSON", done => {
      request( app ).get( "/v2/relationships?fields=all" )
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
      const untrustingFollowedFriendship = _.find(
        fixtures.postgresql.friendships,
        f => f.friend_id === userId && !f.trust
      );
      expect( trustingFollowedFriendship ).not.to.be.undefined;
      request( app ).get( "/v2/relationships?fields=all" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( response => {
          const trustingRelat = _.find( response.body.results,
            r => r.friend_user.id === trustingFollowedFriendship.user_id );
          expect( trustingRelat.reciprocal_trust ).to.be.true;
          const untrustingRelat = _.find( response.body.results,
            r => r.friend_user.id === untrustingFollowedFriendship.user_id );
          expect( untrustingRelat.reciprocal_trust ).to.be.false;
        } )
        .expect( 200, done );
    } );
    it( "should filter by q", done => {
      const friendUserId = fixtures.postgresql.friendships[0].friend_id;
      const friendUser = _.find( fixtures.postgresql.users, u => u.id === friendUserId );
      request( app ).get( `/v2/relationships?fields=all&q=${friendUser.login}` )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( response => {
          expect( response.body.results.length ).to.eq( 1 );
          expect( response.body.results[0].friend_user.login ).to.eq( friendUser.login );
        } )
        .expect( 200, done );
    } );
  } );
  describe( "create", ( ) => {
    it( "should succeed", done => {
      const friendship = fixtures.postgresql.friendships.find( f => f.id === 1 );
      nock( "http://localhost:3000" )
        .post( "/relationships" )
        .reply( 200, { id: friendship.id, friend_id: friendship.friend_id } );
      request( app ).post( "/v2/relationships" )
        .set( "Authorization", token )
        .send( {
          fields: "all",
          relationship: {
            friend_id: friendship.friend_id
          }
        } )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results[0].friend_user.id ).to.eq( friendship.friend_id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
  describe( "update", ( ) => {
    it( "should succeed", done => {
      const friendship = fixtures.postgresql.friendships.find( f => f.id === 1 );
      nock( "http://localhost:3000" )
        .put( `/relationships/${friendship.id}` )
        .reply( 200, friendship );
      request( app ).put( `/v2/relationships/${friendship.id}` ).set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
  describe( "delete", ( ) => {
    it( "should succeed", done => {
      nock( "http://localhost:3000" )
        .delete( "/relationships/1" )
        .reply( 200 );
      request( app ).delete( "/v2/relationships/1" ).set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
