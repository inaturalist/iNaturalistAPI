const request = require( "supertest" );
const { expect } = require( "chai" );
const jwt = require( "jsonwebtoken" );
const sinon = require( "sinon" );
const config = require( "../../../config" );
const Logstasher = require( "../../../lib/logstasher" );

const userToken = jwt.sign(
  { user_id: 123 },
  config.jwtSecret || "secret",
  { algorithm: "HS512" }
);

const applicationToken = jwt.sign(
  { application: "whatever" },
  config.jwtApplicationSecret || "application_secret",
  { algorithm: "HS512" }
);

describe( "LogController", ( ) => {
  describe( "post", ( ) => {
    it( "should fail without auth", function ( done ) {
      request( this.app ).post( "/v2/log" )
        .set( "Content-Type", "application/json" )
        .expect( 401, done );
    } );
    it( "should succeed with just an application token", function ( done ) {
      request( this.app ).post( "/v2/log" )
        .set( "Authorization", applicationToken )
        .set( "Content-Type", "application/json" )
        .expect( 204, done );
    } );
    it( "should succeed with just a user token", function ( done ) {
      request( this.app ).post( "/v2/log" )
        .set( "Authorization", userToken )
        .set( "Content-Type", "application/json" )
        .expect( 204, done );
    } );
    it( "should succeed with both a user and application token", function ( done ) {
      request( this.app ).post( "/v2/log" )
        .set( "Authorization", [userToken, applicationToken].join( ", " ) )
        .set( "Content-Type", "application/json" )
        .expect( 204, done );
    } );
    it( "should succeed with both a user and application token in any order", function ( done ) {
      request( this.app ).post( "/v2/log" )
        .set( "Authorization", [applicationToken, userToken].join( ", " ) )
        .set( "Content-Type", "application/json" )
        .expect( 204, done );
    } );

    describe( "extra payload", ( ) => {
      it( "accepts extra payloads", function ( done ) {
        request( this.app ).post( "/v2/log" )
          .set( "Authorization", userToken )
          .set( "Content-Type", "application/json" )
          .send( {
            extra: {
              string: "string",
              number: 123.4,
              boolean: true
            }
          } )
          .expect( 204, done );
      } );

      it( "does not accept objects in extra payloads", function ( done ) {
        request( this.app ).post( "/v2/log" )
          .set( "Authorization", userToken )
          .set( "Content-Type", "application/json" )
          .send( {
            extra: {
              object: {
                string: "string"
              }
            }
          } )
          .expect( 422, done );
      } );
    } );

    describe( "Logstasher.afterRequestPayload", ( ) => {
      const sandbox = sinon.createSandbox( );

      beforeEach( ( ) => {
        sandbox.spy( Logstasher, "afterRequestPayload" );
      } );

      afterEach( ( ) => {
        sandbox.restore( );
      } );

      it( "should parse the request body for a message", function ( done ) {
        const body = {
          level: "info",
          context: "SomeFileName",
          message: "this is a message"
        };
        request( this.app ).post( "/v2/log" )
          .set( "Authorization", [userToken, applicationToken].join( ", " ) )
          .set( "Content-Type", "application/json" )
          .send( body )
          .expect( 204, ( ) => {
            expect( Logstasher.afterRequestPayload ).to.have.been.called;
            const payload = Logstasher.afterRequestPayload.returnValues[0];
            expect( payload.subtype ).to.eq( "ClientMessage" );
            expect( payload.level ).to.eq( body.level );
            expect( payload.context ).to.eq( body.context );
            expect( payload.error_message ).to.eq( body.message );
            done( );
          } );
      } );
      it( "should parse the request body for an error", function ( done ) {
        const body = {
          level: "error",
          context: "SomeFileName",
          error_type: "SyntaxError",
          message: "this is a message",
          backtrace: "foo\nbar\nbaz"
        };
        request( this.app ).post( "/v2/log" )
          .set( "Authorization", [userToken, applicationToken].join( ", " ) )
          .set( "Content-Type", "application/json" )
          .send( body )
          .expect( 204, ( ) => {
            expect( Logstasher.afterRequestPayload ).to.have.been.called;
            const payload = Logstasher.afterRequestPayload.returnValues[0];
            expect( payload.subtype ).to.eq( "ClientError" );
            expect( payload.level ).to.eq( body.level );
            expect( payload.context ).to.eq( body.context );
            expect( payload.error_type ).to.eq( body.error_type );
            expect( payload.error_message ).to.eq( body.message );
            expect( payload.backtrace ).to.eq( body.backtrace );
            done( );
          } );
      } );

      it( "logs extra payloads", function ( done ) {
        const body = {
          extra: {
            string: "string",
            number: 123.4,
            boolean: true
          }
        };
        request( this.app ).post( "/v2/log" )
          .set( "Authorization", [userToken, applicationToken].join( ", " ) )
          .set( "Content-Type", "application/json" )
          .send( body )
          .expect( 204, ( ) => {
            expect( Logstasher.afterRequestPayload ).to.have.been.called;
            const payload = Logstasher.afterRequestPayload.returnValues[0];
            expect( payload.extra.string ).to.eq( body.extra.string );
            expect( payload.extra.number ).to.eq( body.extra.number );
            expect( payload.extra.boolean ).to.eq( body.extra.boolean );
            done( );
          } );
      } );
    } );
  } );
} );
