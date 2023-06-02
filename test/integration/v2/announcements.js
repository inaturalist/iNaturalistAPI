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
  const announcement = _.find( fixtures.postgresql.announcements, a => a.id === 1 );

  describe( "search", ( ) => {
    it( "returns announcements", function ( done ) {
      request( this.app ).get( "/v2/announcements?fields=all" ).expect( res => {
        expect( res.body.results[0].id ).to.eq( announcement.id );
        expect( res.body.results[0].body ).to.eq( announcement.body );
      } ).expect( "Content-Type", /json/ )
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
