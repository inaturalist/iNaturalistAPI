const { expect } = require( "chai" );
const _ = require( "lodash" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const fs = require( "fs" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Announcements", ( ) => {
  const token = jwt.sign( { user_id: 333 },
    config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  const announcement = _.find( fixtures.postgresql.announcements, a => a.body.match( /^Active/ ) );

  describe( "search", ( ) => {
    it( "returns announcements", function ( done ) {
      request( this.app ).get( "/v2/announcements?fields=all" ).expect( res => {
        expect( res.body.results[0].id ).to.eq( announcement.id );
        expect( res.body.results[0].body ).to.eq( announcement.body );
      } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
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
