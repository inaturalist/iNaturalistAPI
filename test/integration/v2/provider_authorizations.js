const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const request = require( "supertest" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "ProviderAuthorizations", ( ) => {
  const user = _.find( fixtures.postgresql.users, u => u.id === 123 );
  const token = jwt.sign( { user_id: user.id },
    config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  const authorization = _.find(
    fixtures.postgresql.provider_authorizations,
    pa => pa.user_id === user.id
  );
  describe( "index", ( ) => {
    it( "should 401 without auth", function ( done ) {
      request( this.app )
        .get( "/v2/provider_authorizations" )
        .expect( 401, done );
    } );
    it( "should return JSON", function ( done ) {
      request( this.app )
        .get( "/v2/provider_authorizations?fields=all" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          const r = res.body.results[0];
          expect( r.provider_name ).to.eq( authorization.provider_name );
          expect( res.body.total_results ).to.eq( _.filter(
            fixtures.postgresql.provider_authorizations,
            pa => pa.user_id === user.id
          ).length );
        } )
        .expect( 200, done );
    } );
  } );
  describe( "delete", ( ) => {
    it( "should 401 without auth", function ( done ) {
      request( this.app )
        .delete( `/v2/provider_authorizations/${authorization.id}` )
        .expect( 401, done );
    } );
    it( "should hit the Rails equivalent and return 200", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .delete( `/provider_authorizations/${authorization.id}` )
        .reply( 200 );
      request( this.app )
        .delete( `/v2/provider_authorizations/${authorization.id}` )
        .set( "Authorization", token )
        .expect( ( ) => {
          // Raise an exception if the nocked endpoint doesn't get called
          nockScope.done( );
        } )
        .expect( 204, done );
    } );
  } );
} );
