const { expect } = require( "chai" );
const request = require( "supertest" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );

describe( "geoip_lookup", ( ) => {
  describe( "ping", ( ) => {
    it( "fails without a token", function ( done ) {
      request( this.app ).get( "/v1/geoip_lookup?ip=128.128.128.128" )
        .set( "Authorization", "" )
        .expect( 401, done );
    } );

    it( "fails without a valid token", function ( done ) {
      const token = jwt.sign( { application: "whatever" },
        "not the right secret",
        { algorithm: "HS512" } );
      request( this.app ).get( "/v1/geoip_lookup?ip=128.128.128.128" )
        .set( "Authorization", token )
        .expect( 401, done );
    } );

    it( "returns geoip responses", function ( done ) {
      const token = jwt.sign( { application: "whatever" },
        config.jwtApplicationSecret || "application_secret",
        { algorithm: "HS512" } );
      request( this.app ).get( "/v1/geoip_lookup?ip=128.128.128.128" )
        .set( "Authorization", token )
        .expect( res => {
          expect( res.body.results.country ).to.not.be.undefined;
          expect( res.body.results.ll[0] ).to.be.within( -90, 90 );
          expect( res.body.results.ll[1] ).to.be.within( -180, 180 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
