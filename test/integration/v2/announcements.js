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
  const announcementsActiveResponse = [{
    ...announcement,
    locales: [],
    clients: []
  }];

  describe( "/announcements", ( ) => {
    it( "returns announcements", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .get( "/announcements/active" )
        .query( true )
        .reply( 200, announcementsActiveResponse );
      request( this.app ).get( "/v2/announcements?fields=all" ).expect( res => {
        expect( res.body.results[0].id ).to.eq( announcement.id );
        expect( res.body.results[0].body ).to.eq( announcement.body );
      } ).expect( "Content-Type", /json/ )
        .expect( ( ) => {
          // Raise an exception if the nocked endpoint doesn't get called
          nockScope.done( );
        } )
        .expect( 200, done );
    } );

    it( "passes through the client param", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .get( "/announcements/active?client=inat-ios" )
        .reply( 200, announcementsActiveResponse );
      request( this.app ).get( "/v2/announcements?client=inat-ios" )
        .expect( "Content-Type", /json/ )
        .expect( ( ) => nockScope.done( ) )
        .expect( 200, done );
    } );
    it( "passes through the locale param", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .get( "/announcements/active?locale=ka" )
        .reply( 200, announcementsActiveResponse );
      request( this.app ).get( "/v2/announcements?locale=ka" )
        .expect( "Content-Type", /json/ )
        .expect( ( ) => nockScope.done( ) )
        .expect( 200, done );
    } );
    it( "passes through the placement param", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .get( "/announcements/active?placement=mobile" )
        .reply( 200, announcementsActiveResponse );
      request( this.app ).get( "/v2/announcements?placement=mobile" )
        .expect( "Content-Type", /json/ )
        .expect( ( ) => nockScope.done( ) )
        .expect( 200, done );
    } );
    it( "passes through the User-Agent header", function ( done ) {
      const userAgent = "iNaturalist/708 CFNetwork/1410.0.3 Darwin/22.6.0";
      const nockScope = nock( "http://localhost:3000" )
        .get( "/announcements/active" )
        .matchHeader( "User-Agent", userAgent )
        .reply( 200, announcementsActiveResponse );
      request( this.app )
        .get( "/v2/announcements" )
        .set( "User-Agent", userAgent )
        .expect( "Content-Type", /json/ )
        .expect( ( ) => nockScope.done( ) )
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
