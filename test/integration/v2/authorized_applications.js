const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const request = require( "supertest" );
const app = require( "../../../app" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "AuthorizedApplications", ( ) => {
  const user = _.find( fixtures.postgresql.users, u => u.id === 123 );
  const token = jwt.sign( { user_id: user.id }, config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  describe( "index", ( ) => {
    const accessToken = _.find( fixtures.postgresql.oauth_access_tokens,
      t => t.resource_owner_id === user.id );
    const oauthApp = _.find( fixtures.postgresql.oauth_applications,
      a => a.id === accessToken.application_id );
    it( "should 401 without auth", done => {
      request( app )
        .get( "/v2/authorized_applications" )
        .expect( 401, done );
    } );
    it( "should return JSON", done => {
      request( app )
        .get( "/v2/authorized_applications?fields=all" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          const r = res.body.results[0];
          expect( r.application.id ).to.eq( oauthApp.id );
          expect( r.application.name ).to.eq( oauthApp.name );
          expect( r.application.official ).to.eq( oauthApp.official );
          expect( r.created_at ).not.to.be.undefined;
          expect( r.scopes ).not.to.be.undefined;
          expect( res.body.total_results ).to.eq( _.filter(
            fixtures.postgresql.oauth_access_tokens,
            t => ( t.resource_owner_id === user.id && !t.revoked_at )
          ).length );
        } )
        .expect( 200, done );
    } );
  } );
  describe( "delete", ( ) => {
    it( "should hit the Rails equivalent and return 200", done => {
      const nockScope = nock( "http://localhost:3000" )
        .delete( "/oauth/authorized_applications/1" )
        .reply( 200 );
      request( app )
        .delete( "/v2/authorized_applications/1" )
        .set( "Authorization", token )
        .expect( ( ) => {
          // Raise an exception if the nocked endpoint doesn't get called
          nockScope.done( );
        } )
        .expect( 204, done );
    } );
  } );
} );
