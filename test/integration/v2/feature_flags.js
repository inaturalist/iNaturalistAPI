const { expect } = require( "chai" );
const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const request = require( "supertest" );
const nock = require( "nock" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "FeatureFlags", ( ) => {
  const currentUser = fixtures.elasticsearch.users.user[0];
  const userToken = jwt.sign(
    { user_id: currentUser.id },
    config.jwtSecret || "secret",
    { algorithm: "HS512" }
  );
  const applicationToken = jwt.sign(
    { application: "whatever" },
    config.jwtApplicationSecret || "application_secret",
    { algorithm: "HS512" }
  );
  const railsResponse = {
    flags: { client_demo_banner: false, client_smoke_test: true },
    experiments: { hello_world: null, other_test: "treatment" }
  };

  afterEach( ( ) => {
    nock.cleanAll( );
  } );

  describe( "GET /v2/feature_flags", ( ) => {
    it( "returns flags and experiments for an anonymous caller without forwarding a token", function ( done ) {
      const nockScope = nock( "http://localhost:3000", { badheaders: ["Authorization"] } )
        .get( "/feature_flags" )
        .query( true )
        .reply( 200, railsResponse );
      request( this.app ).get( "/v2/feature_flags" )
        .expect( ( ) => nockScope.done( ) )
        .expect( res => {
          expect( res.body ).to.deep.eq( railsResponse );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "forwards a user JWT to Rails verbatim", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .matchHeader( "Authorization", userToken )
        .get( "/feature_flags" )
        .query( true )
        .reply( 200, railsResponse );
      request( this.app ).get( "/v2/feature_flags" )
        .set( "Authorization", userToken )
        .expect( ( ) => nockScope.done( ) )
        .expect( res => {
          expect( res.body.flags.client_smoke_test ).to.eq( true );
          expect( res.body.experiments.other_test ).to.eq( "treatment" );
        } )
        .expect( 200, done );
    } );

    it( "forwards an application JWT to Rails verbatim and never requires a user", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .matchHeader( "Authorization", applicationToken )
        .get( "/feature_flags" )
        .query( true )
        .reply( 200, railsResponse );
      request( this.app ).get( "/v2/feature_flags" )
        .set( "Authorization", applicationToken )
        .expect( ( ) => nockScope.done( ) )
        .expect( 200, done );
    } );

    it( "sets a private Cache-Control header", function ( done ) {
      nock( "http://localhost:3000" )
        .get( "/feature_flags" )
        .query( true )
        .reply( 200, railsResponse );
      request( this.app ).get( "/v2/feature_flags" )
        .expect( res => {
          expect( res.get( "Cache-Control" ) ).to.eq( "private, max-age=60" );
        } )
        .expect( 200, done );
    } );

    // Per-actor payload in a shared cache would expose user A's flags to user B
    it( "ignores the ttl param and never marks the response public", function ( done ) {
      const nockScope = nock( "http://localhost:3000" )
        .get( "/feature_flags" )
        .query( q => !( "ttl" in q ) )
        .reply( 200, railsResponse );
      request( this.app ).get( "/v2/feature_flags?ttl=30" )
        .expect( ( ) => nockScope.done( ) )
        .expect( res => {
          expect( res.get( "Cache-Control" ) ).to.eq( "private, max-age=60" );
        } )
        .expect( 200, done );
    } );

    it( "accepts empty maps", function ( done ) {
      nock( "http://localhost:3000" )
        .get( "/feature_flags" )
        .query( true )
        .reply( 200, { flags: { }, experiments: { } } );
      request( this.app ).get( "/v2/feature_flags" )
        .expect( res => {
          expect( res.body ).to.deep.eq( { flags: { }, experiments: { } } );
        } )
        .expect( 200, done );
    } );

    it( "accepts null experiment variants", function ( done ) {
      nock( "http://localhost:3000" )
        .get( "/feature_flags" )
        .query( true )
        .reply( 200, { flags: { }, experiments: { hello_world: null } } );
      request( this.app ).get( "/v2/feature_flags" )
        .expect( res => {
          expect( res.body.experiments ).to.deep.eq( { hello_world: null } );
        } )
        .expect( 200, done );
    } );

    it( "drops undocumented top-level keys from Rails instead of failing validation", function ( done ) {
      nock( "http://localhost:3000" )
        .get( "/feature_flags" )
        .query( true )
        .reply( 200, { ...railsResponse, something_new: 1 } );
      request( this.app ).get( "/v2/feature_flags" )
        .expect( res => {
          expect( res.body ).to.deep.eq( railsResponse );
        } )
        .expect( 200, done );
    } );

    describe( "when Rails fails", ( ) => {
      it( "fails closed with empty maps on an upstream error status", function ( done ) {
        const nockScope = nock( "http://localhost:3000" )
          .get( "/feature_flags" )
          .query( true )
          .reply( 500, { error: "Internal Server Error" } );
        request( this.app ).get( "/v2/feature_flags" )
          .expect( ( ) => nockScope.done( ) )
          .expect( res => {
            expect( res.body ).to.deep.eq( { flags: { }, experiments: { } } );
            expect( res.get( "Cache-Control" ) ).to.eq( "private, max-age=60" );
          } )
          .expect( 200, done );
      } );

      it( "fails closed with empty maps when Rails is unreachable", function ( done ) {
        const nockScope = nock( "http://localhost:3000" )
          .get( "/feature_flags" )
          .query( true )
          .replyWithError( { code: "ECONNREFUSED", message: "connect ECONNREFUSED" } );
        request( this.app ).get( "/v2/feature_flags" )
          .expect( ( ) => nockScope.done( ) )
          .expect( res => {
            expect( res.body ).to.deep.eq( { flags: { }, experiments: { } } );
            expect( res.get( "Cache-Control" ) ).to.eq( "private, max-age=60" );
          } )
          .expect( 200, done );
      } );
    } );
  } );
} );
