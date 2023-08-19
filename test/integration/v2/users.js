const _ = require( "lodash" );
const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const request = require( "supertest" );
const { expect } = require( "chai" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Users", ( ) => {
  describe( "show", ( ) => {
    it( "should include requested fields", function ( done ) {
      const user = _.find(
        fixtures.postgresql.users,
        u => (
          u.description
          && u.description.length > 0
          && u.last_active
          && u.site_id
        )
      );
      const site = _.find( fixtures.postgresql.sites, s => s.id === user.site_id );
      request( this.app ).post( `/v2/users/${user.id}` )
        .set( "X-HTTP-Method-Override", "GET" )
        .send( {
          fields: {
            description: true,
            site: {
              name: true
            },
            last_active: true
          }
        } )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results[0].description ).to.eq( user.description );
          expect( res.body.results[0].site.name ).to.eq( site.name );
          expect( res.body.results[0].last_active ).not.to.be.undefined;
        } )
        .expect( 200, done );
    } );
  } );
  describe( "update_session", ( ) => {
    it( "should fail without auth", function ( done ) {
      request( this.app ).put( "/v2/users/update_session" )
        .expect( 401, done );
    } );

    // TODO: fix this
    // it( "should fail for suspended users", done => {
    //   const user = _.find( fixtures.postgresql.users, u => u.description === "Suspended user" );
    //   const token = jwt.sign( { user_id: user.id }, config.jwtSecret || "secret",
    //     { algorithm: "HS512" } );
    //   request( app ).put( "/v2/users/update_session" ).set( "Authorization", token )
    //     .expect( 401, done );
    // } );

    it( "should return JSON with auth", function ( done ) {
      const currentUser = fixtures.elasticsearch.users.user[0];
      const token = jwt.sign(
        { user_id: currentUser.id },
        config.jwtSecret || "secret",
        { algorithm: "HS512" }
      );
      nock( "http://localhost:3000" )
        .put( "/users/update_session" )
        .reply( 204 );
      request( this.app ).put( "/v2/users/update_session" ).set( "Authorization", token )
        .expect( 204, done );
    } );
  } );
  describe( "index", ( ) => {
    it( "should return JSON", function ( done ) {
      request( this.app ).get( "/v2/users?fields=login" )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results ).not.to.be.empty;
          expect( res.body.results[0].login ).not.to.be.undefined;
        } )
        .expect( 200, done );
    } );
    it( "should filter by following", function ( done ) {
      const friendship = fixtures.postgresql.friendships[0];
      const followingUserId = friendship.user_id;
      const followingUserIds = _.filter(
        fixtures.postgresql.friendships,
        f => f.friend_id === friendship.friend_id
      ).map( f => f.user_id );
      const notFollowingUserId = _.find(
        fixtures.postgresql.users,
        u => ( followingUserIds.indexOf( u.id ) < 0 )
      ).id;
      request( this.app ).get( `/v2/users?per_page=100&following=${friendship.friend_id}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results ).not.to.be.empty;
          expect(
            _.find( res.body.results, u => u.id === followingUserId )
          ).not.to.be.undefined;
          expect(
            _.find( res.body.results, u => u.id === notFollowingUserId )
          ).to.be.undefined;
        } )
        .expect( 200, done );
    } );
    it( "should filter by followed_by", function ( done ) {
      const friendship = fixtures.postgresql.friendships[0];
      const friendIds = _.filter(
        fixtures.postgresql.friendships,
        f => f.user_id === friendship.user_id
      );
      const notFollowedByUserId = _.find(
        fixtures.postgresql.users,
        u => friendIds.indexOf( u.id ) < 0
      ).id;
      request( this.app ).get( `/v2/users?per_page=100&followed_by=${friendship.user_id}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results ).not.to.be.empty;
          expect(
            _.find( res.body.results, u => u.id === friendship.friend_id )
          ).not.to.be.undefined;
          expect(
            _.find( res.body.results, u => u.id === notFollowedByUserId )
          ).to.be.undefined;
        } )
        .expect( 200, done );
    } );
    it( "should return nothing if followed_by user is not following anyone", function ( done ) {
      const followingUserIds = _.map( fixtures.postgresql.frienships, f => f.user_id );
      const loner = _.find(
        fixtures.postgresql.users,
        u => ( followingUserIds.indexOf( u.id ) < 0 )
      );
      request( this.app ).get( `/v2/users?per_page=100&followed_by=${loner.id}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results ).to.be.empty;
        } )
        .expect( 200, done );
    } );
    it( "should return nothing if following user is not followed by anyone", function ( done ) {
      const followedUserIds = _.map( fixtures.postgresql.frienships, f => f.friend_id );
      const pariah = _.find(
        fixtures.postgresql.users,
        u => ( followedUserIds.indexOf( u.id ) < 0 )
      );
      request( this.app ).get( `/v2/users?per_page=100&following=${pariah.id}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results ).to.be.empty;
        } )
        .expect( 200, done );
    } );
    it( "should return by searched Orcid", function ( done ) {
      request( this.app ).get( "/v2/users?orcid=0000-0001-0002-0004&fields=login" )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results ).not.to.be.empty;
          expect( res.body.results[0].login ).to.eq("a-user");
        } )
        .expect( 200, done );
    } );
  } );

  describe( "update", ( ) => {
    const currentUser = fixtures.elasticsearch.users.user[0];
    const token = jwt.sign( { user_id: currentUser.id },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );

    it( "should fail without auth", function ( done ) {
      request( this.app ).put( "/v2/users/update" )
        .expect( 401, done );
    } );

    it( "should return JSON", function ( done ) {
      nock( "http://localhost:3000" )
        .put( `/users/${currentUser.login}` )
        .reply( 200, { id: currentUser.id, login: currentUser.login } );
      request( this.app )
        .put( `/v2/users/${currentUser.login}` )
        .set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( 200 )
        .expect( res => {
          expect( res.body.login ).to.eq( currentUser.login );
        } )
        .expect( 200, done );
    } );
  } );

  describe( "resend_confirmation", ( ) => {
    const currentUser = fixtures.elasticsearch.users.user[0];
    const token = jwt.sign( { user_id: currentUser.id },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );

    it( "should 401 without auth", function ( done ) {
      request( this.app )
        .post( "/v2/users/resend_confirmation" )
        .expect( 401, done );
    } );
    it( "should hit the Rails equivalent and return 200", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .post( "/users/resend_confirmation" )
        .reply( 200 );
      request( this.app )
        .post( "/v2/users/resend_confirmation" )
        .set( "Authorization", token )
        .expect( ( ) => {
          // Raise an exception if the nocked endpoint doesn't get called
          nockScope.done( );
        } )
        .expect( 200, done );
    } );
  } );

} );
