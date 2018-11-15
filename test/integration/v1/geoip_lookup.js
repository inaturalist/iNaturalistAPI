const { expect } = require( "chai" );
const request = require( "supertest" );
const iNaturalistAPI = require( "../../../lib/inaturalist_api" );

const app = iNaturalistAPI.server( );

describe( "geoip_lookup", ( ) => {
  describe( "ping", ( ) => {
    it( "returns geoip responses", done => {
      request( app ).get( "/v1/geoip_lookup?ip=128.128.128.128" )
        .expect( res => {
          expect( res.body.results.country ).to.eq( "US" );
          expect( res.body.results.region ).to.eq( "NA" );
          expect( res.body.results.ll[0] ).to.be.above( 41 );
          expect( res.body.results.ll[0] ).to.be.below( 42 );
          expect( res.body.results.ll[1] ).to.be.above( -71 );
          expect( res.body.results.ll[1] ).to.be.below( -70 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
