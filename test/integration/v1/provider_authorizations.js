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

describe( "ProviderAuthorizations", ( ) => {
  const user = _.find( fixtures.postgresql.users, u => u.id === 123 );
  const token = jwt.sign( { user_id: user.id }, config.jwtSecret || "secret",
    { algorithm: "HS512" } );
  describe( "index", ( ) => {
    it( "should 401 without auth", done => {
      request( app )
        .get( "/v1/provider_authorizations" )
        .expect( 401, done );
    } );
    it( "should return JSON", done => {
      const authorization = _.find(
        fixtures.postgresql.provider_authorizations,
        pa => pa.user_id === user.id
      );
      request( app )
        .get( "/v1/provider_authorizations" )
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
    it( "should hit the Rails equivalent and return 200", done => {
      const nockScope = nock( "http://localhost:3000" )
        .delete( "/provider_authorizations/1" )
        .reply( 200 );
      request( app )
        .delete( "/v1/provider_authorizations/1" )
        .set( "Authorization", token )
        .expect( ( ) => {
          // Raise an exception if the nocked endpoint doesn't get called
          nockScope.done( );
        } )
        .expect( 200, done );
    } );
  } );
} );
