const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const request = require( "supertest" );
const iNaturalistAPI = require( "../../../lib/inaturalist_api" );
const config = require( "../../../config.js" );

const app = iNaturalistAPI.server( );

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
        .get( "/v1/authorized_applications" )
        .expect( 401, done );
    } );
    it( "should return JSON", done => {
      request( app )
        .get( "/v1/authorized_applications" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          const r = res.body.results[0];
          expect( r.application.id ).to.eq( oauthApp.id );
          expect( r.application.name ).to.eq( oauthApp.name );
          expect( r.created_at ).not.to.be.undefined;
          expect( r.scopes ).not.to.be.undefined;
          expect( res.body.total_results ).to.eq( _.filter(
            fixtures.postgresql.oauth_access_tokens,
            t => ( t.resource_owner_id === user.id && !t.revoked_at )
          ).length );
        } )
        .expect( 200, done );
    } );
    it( "should only return authorizations for the current user", done => {
      const activeUserTokens = _.filter( fixtures.postgresql.oauth_access_tokens,
        t => ( t.resource_owner_id === user.id && !t.revoked_at ) );
      request( app )
        .get( "/v1/authorized_applications" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          const symDiff = _.xor(
            res.body.results.map( a => a.application.id ),
            activeUserTokens.map( t => t.application_id )
          );
          expect( symDiff.length ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( activeUserTokens.length );
        } )
        .expect( 200, done );
    } );
    it( "should not return revoked tokens", done => {
      const revokedToken = _.find( fixtures.postgresql.oauth_access_tokens,
        t => ( t.resource_owner_id === user.id && t.revoked_at ) );
      expect( revokedToken ).not.to.be.undefined;
      request( app )
        .get( "/v1/authorized_applications" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          // This is a bit brittle since it assumes there aren't revoked and
          // unrevoked grants for the same application for this user
          expect(
            _.find( res.body.results,
              r => r.application.id === revokedToken.application_id )
          ).to.be.undefined;
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
        .delete( "/v1/authorized_applications/1" )
        .set( "Authorization", token )
        .expect( ( ) => {
          // Raise an exception if the nocked endpoint doesn't get called
          nockScope.done( );
        } )
        .expect( 200, done );
    } );
  } );
} );
