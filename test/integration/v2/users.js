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
    it( "never returns email or IP for user", function ( done ) {
      request( this.app ).get( "/v2/users/2023092501?fields=all" )
        .expect( res => {
          const user = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( user.id ).to.eq( 2023092501 );
          expect( user ).to.not.have.property( "email" );
          expect( user ).to.not.have.property( "last_ip" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "autocomplete", ( ) => {
    it( "never returns email or IP for user", function ( done ) {
      request( this.app ).get( "/v2/users/autocomplete?q=user2023092501&fields=all" )
        .expect( res => {
          const user = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( user.id ).to.eq( 2023092501 );
          expect( user ).to.not.have.property( "email" );
          expect( user ).to.not.have.property( "last_ip" );
        } ).expect( "Content-Type", /json/ )
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

  describe( "projects", ( ) => {
    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v2/users/2023092501/projects?fields=all" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          const project = _.find( res.body.results, p => p.slug === "project-2023092501" );
          expect( project ).not.to.be.undefined;
          expect( project.admins ).not.to.be.undefined;
          expect( project.admins[0] ).not.to.be.undefined;
          expect( project.admins[0].user ).not.to.be.undefined;
          expect( project.admins[0].user.email ).to.be.undefined;
          expect( project.admins[0].user.last_ip ).to.be.undefined;
          expect( project.user ).not.to.be.undefined;
          expect( project.user.email ).to.be.undefined;
          expect( project.user.last_ip ).to.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
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
          expect( res.body.results[0].login ).to.eq( "a-user" );
        } )
        .expect( 200, done );
    } );
    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v2/users?fields=all&per_page=100" )
        .expect( res => {
          const user = _.find( res.body.results, u => u.id === 2023092501 );
          expect( user ).not.to.be.undefined;
          expect( user.id ).to.eq( 2023092501 );
          expect( user ).to.not.have.property( "email" );
          expect( user ).to.not.have.property( "last_ip" );
        } ).expect( "Content-Type", /json/ )
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

  describe( "notification_counts", ( ) => {
    const currentUserID = fixtures.elasticsearch.update_actions.update_action[0].subscriber_ids[0];
    const token = jwt.sign( { user_id: currentUserID },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );

    it( "should 401 without auth", function ( done ) {
      request( this.app )
        .get( "/v2/users/notification_counts" )
        .expect( 401, done );
    } );

    it( "should return JSON with notification counts", function ( done ) {
      const unreadUpdatesCount = _.size(
        _.filter( fixtures.elasticsearch.update_actions.update_action, updateAction => (
          _.includes( updateAction.subscriber_ids, currentUserID )
          && !_.includes( updateAction.viewed_subscriber_ids, currentUserID )
        ) )
      );
      const unreadMessagesCount = _.size(
        _.filter( fixtures.postgresql.messages, message => (
          message.user_id === currentUserID
          && message.to_user_id === currentUserID
          && !message.read_at
        ) )
      );
      request( this.app )
        .get( "/v2/users/notification_counts" )
        .set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( _.has( res.body, "updates_count" ) ).to.eq( true );
          expect( _.has( res.body, "messages_count" ) ).to.eq( true );
          expect( res.body.updates_count ).to.eq( unreadUpdatesCount );
          expect( res.body.messages_count ).to.eq( unreadMessagesCount );
        } )
        .expect( 200, done );
    } );
  } );
} );
