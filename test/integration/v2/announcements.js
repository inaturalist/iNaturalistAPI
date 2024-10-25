const { expect } = require( "chai" );
const _ = require( "lodash" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const fs = require( "fs" );
const config = require( "../../../config" );
const pgClient = require( "../../../lib/pg_client" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

const fetchAnnouncementImpressions = async ( ) => {
  const { rows } = await pgClient.query( "SELECT * FROM announcement_impressions" );
  return rows;
};

describe( "Announcements", ( ) => {
  const token = jwt.sign( { user_id: 333 },
    config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  const announcement = _.find( fixtures.postgresql.announcements, a => a.body.match( /^Active/ ) );

  afterEach( async ( ) => {
    await pgClient.query( "TRUNCATE TABLE announcement_impressions RESTART IDENTITY" );
  } );

  describe( "search", ( ) => {
    it( "returns announcements", function ( done ) {
      request( this.app ).get( "/v2/announcements?fields=all" ).expect( res => {
        expect( res.body.results[0].id ).to.eq( announcement.id );
        expect( res.body.results[0].body ).to.eq( announcement.body );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "generates announcement impressions", async function ( ) {
      const initialAnnouncementImpressions = await fetchAnnouncementImpressions( );
      expect( _.size( initialAnnouncementImpressions ) ).to.eq( 0 );
      const response = await request( this.app ).get( "/v2/announcements?fields=all" );
      const resultAnnouncementImpressions = await fetchAnnouncementImpressions( );
      expect( _.size( resultAnnouncementImpressions ) ).to.be.above( 0 );
      expect( _.map( resultAnnouncementImpressions, i => Number( i.id ) ).sort ).to.eq(
        _.map( response.body.results, "id" ).sort
      );
      _.each( resultAnnouncementImpressions, impression => {
        expect( impression.user_id ).to.be.null;
        expect( impression.platform_type ).to.eq( "mobile" );
        expect( impression.impressions_count ).to.eq( 1 );
      } );
    } );

    it( "increments announcement impressions counts", async function ( ) {
      const initialAnnouncementImpressions = await fetchAnnouncementImpressions( );
      expect( _.size( initialAnnouncementImpressions ) ).to.eq( 0 );
      await request( this.app ).get( "/v2/announcements?fields=all" );
      await request( this.app ).get( "/v2/announcements?fields=all" );
      await request( this.app ).get( "/v2/announcements?fields=all" );
      const resultAnnouncementImpressions = await fetchAnnouncementImpressions( );
      expect( _.size( resultAnnouncementImpressions ) ).to.be.above( 0 );
      _.each( resultAnnouncementImpressions, impression => {
        expect( impression.impressions_count ).to.eq( 3 );
      } );
    } );

    it( "does not return inactive announcements", function ( done ) {
      request( this.app ).get( "/v2/announcements?fields=all" ).expect( res => {
        expect( _.find( res.body.results, r => r.body.match( /^Inactive/ ) ) ).to.be.undefined;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns announcements with exact hyphenated locale matches", function ( done ) {
      request( this.app ).get( "/v2/announcements?fields=all&locale=en-US" ).expect( res => {
        expect( res.body.results ).to.not.be.empty;
        expect( _.size( _.filter( res.body.results, r => r.locales.includes( "en-US" ) ) ) ).to.eq(
          _.size( res.body.results )
        );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns announcements with exact locale matches", function ( done ) {
      request( this.app ).get( "/v2/announcements?fields=all&locale=en" ).expect( res => {
        expect( res.body.results ).to.not.be.empty;
        expect( _.size( _.filter( res.body.results, r => r.locales.includes( "en" ) ) ) ).to.eq(
          _.size( res.body.results )
        );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns announcements with base locale matches given a hyphenated locale", function ( done ) {
      request( this.app ).get( "/v2/announcements?fields=all&locale=en-ZZ" ).expect( res => {
        expect( res.body.results ).to.not.be.empty;
        expect( _.size( _.filter( res.body.results, r => r.locales.includes( "en" ) ) ) ).to.eq(
          _.size( res.body.results )
        );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns announcements with no locale when given a non-matching locale", function ( done ) {
      request( this.app ).get( "/v2/announcements?fields=all&locale=zz" ).expect( res => {
        expect( res.body.results ).to.not.be.empty;
        expect( _.size( _.filter( res.body.results, r => _.isEmpty( r.locales ) ) ) ).to.eq(
          _.size( res.body.results )
        );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns announcements based on client", function ( done ) {
      const inatiOSAnnouncement = _.find(
        fixtures.postgresql.announcements, a => a.clients.match( /inat-ios/ )
      );
      request( this.app ).get( "/v2/announcements?fields=all&client=inat-ios" ).expect( res => {
        expect( res.body.results ).to.not.be.empty;
        expect( _.every( res.body.results, r => (
          r.clients.includes( "inat-ios" ) || _.isEmpty( r.clients )
        ) ) ).to.be.true;
        expect( _.map( res.body.results, "id" ) ).to.include( inatiOSAnnouncement.id );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns announcements based on user agent", function ( done ) {
      const inatiOSAnnouncement = _.find(
        fixtures.postgresql.announcements, a => a.clients.match( /inat-ios/ )
      );
      request( this.app )
        .get( "/v2/announcements?fields=all" )
        .set( "User-Agent", "iNaturalist/708 CFNetwork/1410.0.3 Darwin/22.6.0" )
        .expect( res => {
          expect( res.body.results ).to.not.be.empty;
          expect( _.every( res.body.results, r => (
            r.clients.includes( "inat-ios" ) || _.isEmpty( r.clients )
          ) ) ).to.be.true;
          expect( _.map( res.body.results, "id" ) ).to.include( inatiOSAnnouncement.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not return announcements with a client not matching parameter", function ( done ) {
      request( this.app ).get( "/v2/announcements?fields=all&client=seek" ).expect( res => {
        expect( res.body.results ).to.not.be.empty;
        expect( _.every( res.body.results, r => _.isEmpty( r.clients ) ) ).to.be.true;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "does not return announcements with a client not matching user agent", function ( done ) {
      request( this.app )
        .get( "/v2/announcements?fields=all" )
        .set( "User-Agent", "Seek/2.15.3 Handset (Build 316) Android/13" )
        .expect( res => {
          expect( res.body.results ).to.not.be.empty;
          expect( _.every( res.body.results, r => _.isEmpty( r.clients ) ) ).to.be.true;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns announcements with matching placement", function ( done ) {
      const welcomePlacementAnnouncement = _.find(
        fixtures.postgresql.announcements, a => a.placement === "welcome/index"
      );
      request( this.app ).get( "/v2/announcements?fields=all&placement=welcome%2Findex" ).expect( res => {
        expect( res.body.results ).to.not.be.empty;
        expect( _.size( res.body.results ) ).to.eq( 1 );
        expect( _.map( res.body.results, "id" ) ).to.include( welcomePlacementAnnouncement.id );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns announcements matching mobile placements", function ( done ) {
      request( this.app ).get( "/v2/announcements?fields=all&placement=mobile" ).expect( res => {
        expect( res.body.results ).to.not.be.empty;
        expect( _.size( res.body.results ) ).to.be.above( 0 );
        expect( _.every( res.body.results, r => r.placement.match( /^mobile/ ) ) ).to.be.true;
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    describe( "targeting", ( ) => {
      it( "targets users with even IDs", function ( done ) {
        const evenUserIDAnnouncement = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /targeting even user_ids/ )
        );
        const evenUserIDToken = jwt.sign( { user_id: 2024071502 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );
        request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", evenUserIDToken )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.include( evenUserIDAnnouncement.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "generates announcement impressions for authenticated requests", async function ( ) {
        const evenUserIDToken = jwt.sign( { user_id: 2024071502 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );

        const initialAnnouncementImpressions = await fetchAnnouncementImpressions( );
        expect( _.size( initialAnnouncementImpressions ) ).to.eq( 0 );
        const response = await request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", evenUserIDToken );
        const resultAnnouncementImpressions = await fetchAnnouncementImpressions( );
        expect( _.size( resultAnnouncementImpressions ) ).to.be.above( 0 );
        expect( _.map( resultAnnouncementImpressions, i => Number( i.id ) ).sort ).to.eq(
          _.map( response.body.results, "id" ).sort
        );
        _.each( resultAnnouncementImpressions, impression => {
          expect( impression.user_id ).to.eq( 2024071502 );
          expect( impression.platform_type ).to.eq( "mobile" );
          expect( impression.impressions_count ).to.eq( 1 );
        } );
      } );

      it( "increments announcement impressions for authenticated requests", async function ( ) {
        const evenUserIDToken = jwt.sign( { user_id: 2024071502 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );

        const initialAnnouncementImpressions = await fetchAnnouncementImpressions( );
        expect( _.size( initialAnnouncementImpressions ) ).to.eq( 0 );
        await request( this.app ).get( "/v2/announcements" ).set( "Authorization", evenUserIDToken );
        await request( this.app ).get( "/v2/announcements" ).set( "Authorization", evenUserIDToken );
        await request( this.app ).get( "/v2/announcements" ).set( "Authorization", evenUserIDToken );
        const resultAnnouncementImpressions = await fetchAnnouncementImpressions( );
        expect( _.size( resultAnnouncementImpressions ) ).to.be.above( 0 );
        _.each( resultAnnouncementImpressions, impression => {
          expect( impression.user_id ).to.eq( 2024071502 );
          expect( impression.impressions_count ).to.eq( 3 );
        } );
      } );

      it( "does not include announcements targeting even user IDs if user ID is odd", function ( done ) {
        const evenUserIDAnnouncement = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /targeting even user_ids/ )
        );
        const oddUserIDToken = jwt.sign( { user_id: 2024071501 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );
        request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", oddUserIDToken )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.not.include( evenUserIDAnnouncement.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "does not include announcements targeting even user IDs if unauthenticated", function ( done ) {
        const evenUserIDAnnouncement = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /targeting even user_ids/ )
        );
        request( this.app )
          .get( "/v2/announcements" )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.not.include( evenUserIDAnnouncement.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "targets users with even IDs", function ( done ) {
        const evenUserCreatedAnnouncement = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /targeting even created seconds/ )
        );
        const evenUserCreatedToken = jwt.sign( { user_id: 2024071501 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );
        request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", evenUserCreatedToken )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.include( evenUserCreatedAnnouncement.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "does not include announcements targeting even user created seconds if user second is odd", function ( done ) {
        const evenUserIDAnnouncement = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /targeting even created seconds/ )
        );
        const oddUserCreatedToken = jwt.sign( { user_id: 2024071502 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );
        request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", oddUserCreatedToken )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.not.include( evenUserIDAnnouncement.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "targets users with even ID sums", function ( done ) {
        const evenIDSumAnnouncement = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /targeting even user_id digit sums/ )
        );
        const evenIDSumToken = jwt.sign( { user_id: 2024071501 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );
        request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", evenIDSumToken )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.include( evenIDSumAnnouncement.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "does not include announcements targeting even ID sums if ID sum is odd", function ( done ) {
        const evenIDSumAnnouncement = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /targeting even user_id digit sums/ )
        );
        const oddIDSumToken = jwt.sign( { user_id: 2024071502 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );
        request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", oddIDSumToken )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.not.include( evenIDSumAnnouncement.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );

    describe( "targeting donor dates", ( ) => {
      it( "includes announcements targeting donors", function ( done ) {
        const donor2024 = _.find( fixtures.postgresql.users, u => u.name?.match( /2024 donation/ ) );
        const announcementTo2024Donors = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /targeting 2024 donors/ )
        );
        const donor2024Token = jwt.sign( { user_id: donor2024.id },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );
        request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", donor2024Token )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.include( announcementTo2024Donors.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "does not include announcements targeting donors if requestor is not a donor", function ( done ) {
        const announcementTo2024Donors = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /targeting 2024 donors/ )
        );
        const donor2024Token = jwt.sign( { user_id: 1 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );
        request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", donor2024Token )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.not.include( announcementTo2024Donors.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "does not include announcements targeting donors if unauthenticated", function ( done ) {
        const announcementTo2024Donors = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /targeting 2024 donors/ )
        );
        request( this.app )
          .get( "/v2/announcements" )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.not.include( announcementTo2024Donors.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "excludes announcements excluding donors", function ( done ) {
        const donor2024 = _.find( fixtures.postgresql.users, u => u.name?.match( /2024 donation/ ) );
        const announcementExcluding2024Donors = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /excluding 2024 donors/ )
        );
        const donor2024Token = jwt.sign( { user_id: donor2024.id },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );
        request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", donor2024Token )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.not.include( announcementExcluding2024Donors.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "does not exclude announcements excluding donors if requestor is not a donor", function ( done ) {
        const announcementExcluding2024Donors = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /excluding 2024 donors/ )
        );
        const donor2024Token = jwt.sign( { user_id: 1 },
          config.jwtSecret || "secret",
          { algorithm: "HS512" } );
        request( this.app )
          .get( "/v2/announcements" )
          .set( "Authorization", donor2024Token )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.include( announcementExcluding2024Donors.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );

      it( "does not exclude announcements excluding donors if request is unauthenticated", function ( done ) {
        const announcementExcluding2024Donors = _.find(
          fixtures.postgresql.announcements, a => a.body.match( /excluding 2024 donors/ )
        );
        request( this.app )
          .get( "/v2/announcements" )
          .expect( res => {
            expect( res.body.results ).to.not.be.empty;
            expect( _.map( res.body.results, "id" ) ).to.include( announcementExcluding2024Donors.id );
          } )
          .expect( "Content-Type", /json/ )
          .expect( 200, done );
      } );
    } );
  } );

  describe( "dismiss", ( ) => {
    it( "requires authentication", function ( done ) {
      request( this.app ).put( `/v2/announcements/${announcement.id}/dismiss` )
        .expect( 401, done );
    } );

    it( "returns 204 for success", function ( done ) {
      nock( "http://localhost:3000" )
        .put( `/announcements/${announcement.id}/dismiss` )
        .reply( 204, {} );
      request( this.app ).put( `/v2/announcements/${announcement.id}/dismiss` )
        .set( "Authorization", token )
        .expect( 204, done );
    } );
  } );
} );
