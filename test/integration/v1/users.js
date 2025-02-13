const _ = require( "lodash" );
const { expect } = require( "chai" );
const jwt = require( "jsonwebtoken" );
const request = require( "supertest" );
const nock = require( "nock" );
const fs = require( "fs" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Users", ( ) => {
  describe( "show", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v1/users/5" )
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
    it( "accepts a login in place of an ID", function ( done ) {
      request( this.app ).get( "/v1/users/b-user" )
        .expect( res => {
          const user = res.body.results[0];
          expect( user.id ).to.eq( 5 );
          expect( user.login ).to.eq( "b-user" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns a 404 for unknown users", function ( done ) {
      request( this.app ).get( "/v1/users/123123" )
        .expect( "Content-Type", /json/ ).expect( 404, done );
    } );

    it( "never returns email or IP for user", function ( done ) {
      request( this.app ).get( "/v1/users/2023092501" )
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

  describe( "update", ( ) => {
    const currentUser = fixtures.elasticsearch.users.user[0];
    const token = jwt.sign( { user_id: currentUser.id },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );

    it( "should return JSON", function ( done ) {
      nock( "http://localhost:3000" )
        .put( `/users/${currentUser.login}` )
        .reply( 200, { id: currentUser.id, login: currentUser.login } );
      request( this.app )
        .put( `/v1/users/${currentUser.login}` )
        .set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( 200 )
        .expect( res => {
          expect( res.body.login ).to.eq( currentUser.login );
        } )
        .expect( 200, done );
    } );
  } );

  describe( "autocomplete", ( ) => {
    it( "returns an empty response if not given a query", function ( done ) {
      request( this.app ).get( "/v1/users/autocomplete" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 0 );
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( 0 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns partial matches", function ( done ) {
      request( this.app ).get( "/v1/users/autocomplete?q=userlogin" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].login ).to.eq( "userlogin" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "ignores case", function ( done ) {
      request( this.app ).get( "/v1/users/autocomplete?q=UsErLoGIN" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].login ).to.eq( "userlogin" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user", function ( done ) {
      request( this.app ).get( "/v1/users/autocomplete?q=user2023092501" )
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

  describe( "projects", ( ) => {
    it( "returns a 422 for unknown users", function ( done ) {
      request( this.app ).get( "/v1/users/nobody/projects" )
        .expect( "Content-Type", /json/ ).expect( 422, done );
    } );

    it( "returns projects given a user ID", function ( done ) {
      request( this.app ).get( "/v1/users/1/projects" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( _.find( res.body.results, p => p.slug === "project-one" ) ).not.to.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns projects given a user login", function ( done ) {
      request( this.app ).get( "/v1/users/userlogin/projects" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( _.find( res.body.results, p => p.slug === "project-one" ) ).not.to.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v1/users/2023092501/projects" )
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

  describe( "me", ( ) => {
    it( "fails for unauthenticated requests", function ( done ) {
      request( this.app ).get( "/v1/users/me" ).expect( res => {
        expect( res.error.text ).to.eq( "{\"error\":\"Unauthorized\",\"status\":401}" );
      } ).expect( "Content-Type", /json/ )
        .expect( 401, done );
    } );

    it( "fails for suspended users", function ( done ) {
      const user = _.find( fixtures.postgresql.users, u => u.description === "Suspended user" );
      const token = jwt.sign( { user_id: user.id },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( "/v1/users/me" ).set( "Authorization", token ).expect( res => {
        expect( res.error.text ).to.eq( "{\"error\":\"Unauthorized\",\"status\":401}" );
      } )
        .expect( "Content-Type", /json/ )
        .expect( 401, done );
    } );

    it( "returns the logged-in users object", function ( done ) {
      const token = jwt.sign( { user_id: 1 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      // The default state for most users will be to not have this preference
      // explicitly set, but the default should still be true, so I'm just
      // making sure that's the case for this user
      const existingCommonNamesPref = _.find( fixtures.postgresql.preferences,
        p => p.name === "common_names" && p.owner_type === "User" && p.owner_id === 1 );
      expect( existingCommonNamesPref ).to.be.undefined;
      request( this.app ).get( "/v1/users/me" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].id ).to.eq( 1 );
          expect( res.body.results[0].prefers_common_names ).to.eq( true );
          expect( res.body.results[0].site.id ).to.eq( 1 );
          expect( res.body.results[0].site.url ).to.eq( "https://www.inaturalist.org" );
          expect( res.body.results[0].site.place_id ).to.eq( 1 );
          expect( res.body.results[0].site.locale ).to.eq( "en" );
          expect( res.body.results[0].site.site_name_short ).to.eq( "iNat" );
          expect( res.body.results[0].icon_url ).not.to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns prefers_common_names if set to false", function ( done ) {
      const user = _.find( fixtures.postgresql.users, u => u.login === "prefers-no-common-names" );
      const existingCommonNamesPref = _.find( fixtures.postgresql.preferences,
        p => p.name === "common_names" && p.owner_type === "User" && p.owner_id === user.id );
      expect( existingCommonNamesPref.value ).to.eq( "f" );
      const token = jwt.sign( { user_id: user.id },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( "/v1/users/me" ).set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results[0].prefers_common_names ).to.eq( false );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns user privileges", function ( done ) {
      const token = jwt.sign( { user_id: 1 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( "/v1/users/me" ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].privileges[0] ).to.eq( "speech" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    _.each( [
      "confirmation_sent_at",
      "confirmed_at",
      "created_at",
      "data_transfer_consent",
      "description",
      "email",
      "id",
      "login",
      "monthly_supporter",
      "name",
      "pi_consent",
      "preferred_observation_fields_by",
      "preferred_observation_license",
      "preferred_photo_license",
      "preferred_project_addition_by",
      "preferred_sound_license",
      "prefers_automatic_taxonomic_changes",
      "prefers_comment_email_notification",
      "prefers_common_names",
      "prefers_community_taxa",
      "prefers_identification_email_notification",
      "prefers_mention_email_notification",
      "prefers_message_email_notification",
      "prefers_monthly_supporter_badge",
      "prefers_no_email",
      "prefers_no_tracking",
      "prefers_project_added_your_observation_email_notification",
      "prefers_project_curator_change_email_notification",
      "prefers_project_journal_post_email_notification",
      "prefers_receive_mentions",
      "prefers_redundant_identification_notifications",
      "prefers_scientific_name_first",
      "prefers_taxon_change_email_notification",
      "prefers_taxon_or_place_observation_email_notification",
      "prefers_user_observation_email_notification",
      "search_place_id",
      "time_zone",
      "unconfirmed_email",
      "updated_at"
    ], a => {
      it( `returns ${a}`, function ( done ) {
        const token = jwt.sign(
          { user_id: 1 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" }
        );
        request( this.app ).get( "/v1/users/me" ).set( "Authorization", token )
          .expect( res => {
            expect( res.body.results[0][a] ).not.to.be.undefined;
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );
  } );

  describe( "mute", ( ) => {
    const currentUser = fixtures.elasticsearch.users.user[0];
    const mutedUser = fixtures.elasticsearch.users.user[1];
    const token = jwt.sign( { user_id: currentUser.id },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    describe( "post", ( ) => {
      it( "succeeds", function ( done ) {
        nock( "http://localhost:3000" )
          .post( `/users/${mutedUser.id}/mute` )
          .reply( 200 );
        request( this.app )
          .post( `/v1/users/${mutedUser.id}/mute` )
          .set( "Authorization", token )
          .expect( 200, done );
      } );
    } );
    describe( "delete", ( ) => {
      it( "succeeds", function ( done ) {
        nock( "http://localhost:3000" )
          .delete( `/users/${mutedUser.id}/mute` )
          .reply( 200 );
        request( this.app )
          .delete( `/v1/users/${mutedUser.id}/mute` )
          .set( "Authorization", token )
          .expect( 200, done );
      } );
    } );
  } );

  describe( "block", ( ) => {
    const currentUser = fixtures.elasticsearch.users.user[0];
    const blockedUser = fixtures.elasticsearch.users.user[1];
    const token = jwt.sign( { user_id: currentUser.id },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    describe( "post", ( ) => {
      it( "succeeds", function ( done ) {
        nock( "http://localhost:3000" )
          .post( `/users/${blockedUser.id}/block` )
          .reply( 200 );
        request( this.app )
          .post( `/v1/users/${blockedUser.id}/block` )
          .set( "Authorization", token )
          .expect( 200, done );
      } );
    } );
    describe( "delete", ( ) => {
      it( "succeeds", function ( done ) {
        nock( "http://localhost:3000" )
          .delete( `/users/${blockedUser.id}/block` )
          .reply( 200 );
        request( this.app )
          .delete( `/v1/users/${blockedUser.id}/block` )
          .set( "Authorization", token )
          .expect( 200, done );
      } );
    } );
  } );

  describe( "recentObservationFields", ( ) => {
    it( "fails for unauthenticated requests", function ( done ) {
      request( this.app ).get( "/v1/users/recent_observation_fields" ).expect( res => {
        expect( res.error.text ).to.eq( "{\"error\":\"Unauthorized\",\"status\":401}" );
      } ).expect( "Content-Type", /json/ )
        .expect( 401, done );
    } );

    it( "returns observation fields", function ( done ) {
      const token = jwt.sign( { user_id: 1 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      const fixtureObservationField = fixtures.postgresql.observation_fields[0];
      request( this.app ).get( "/v1/users/recent_observation_fields" )
        .set( "Authorization", token )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].id ).to.eq( fixtureObservationField.id );
          expect( res.body.results[0].name ).to.eq( fixtureObservationField.name );
          expect( res.body.results[0].description ).to.eq( fixtureObservationField.description );
          expect( res.body.results[0].datatype ).to.eq( fixtureObservationField.datatype );
          expect( res.body.results[0].allowed_values ).to
            .eq( fixtureObservationField.allowed_values );
        } )
        .expect( "Content-Type", /json/ )
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
        .post( "/v1/users/resend_confirmation" )
        .expect( 401, done );
    } );
    it( "should hit the Rails equivalent and return 200", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .post( "/users/resend_confirmation" )
        .reply( 200 );
      request( this.app )
        .post( "/v1/users/resend_confirmation" )
        .set( "Authorization", token )
        .expect( ( ) => {
          // Raise an exception if the nocked endpoint doesn't get called
          nockScope.done( );
        } )
        .expect( 200, done );
    } );
  } );

  describe( "email_available", ( ) => {
    it( "should return a 401 status from the Rails app", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .get( "/users/email_available" )
        .reply( 401 );
      request( this.app )
        .get( "/v1/users/email_available" )
        .expect( ( ) => {
          // Raise an exception if the nocked endpoint doesn't get called
          nockScope.done( );
        } )
        .expect( 401, done );
    } );
    it( "should return JSON from the Rails app", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .get( "/users/email_available?email=foo@bar.com" )
        .reply( 200, { available: true } );
      request( this.app )
        .get( "/v1/users/email_available?email=foo@bar.com" )
        .expect( ( ) => {
          // Raise an exception if the nocked endpoint doesn't get called
          nockScope.done( );
        } )
        .expect( res => {
          expect( res.body.available ).to.be.true;
        } )
        .expect( 200, done );
    } );
  } );
} );
