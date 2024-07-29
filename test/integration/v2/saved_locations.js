const { expect } = require( "chai" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );

describe( "SavedLocations", ( ) => {
  const token = jwt.sign(
    { user_id: 333 },
    config.jwtSecret || "secret",
    { algorithm: "HS512" }
  );

  describe( "search", ( ) => {
    it( "returns JSON", function ( done ) {
      nock( "http://localhost:3000" )
        .get( "/saved_locations" )
        .reply( 200, {
          total_results: 1,
          page: 1,
          per_page: 1,
          results: [{
            id: 1
          }]
        } );
      request( this.app ).get( "/v2/saved_locations" )
        .set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "create", ( ) => {
    it( "returns JSON", function ( done ) {
      nock( "http://localhost:3000" )
        .post( "/saved_locations" )
        .reply( 200, { id: 1 } );
      request( this.app ).post( "/v2/saved_locations" )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        // Actual values of what we send don't matter since we're mocking the
        // Rails response, but we need it to pass request schema validation
        .send( {
          saved_location: {
            latitude: 1.1,
            longitude: 2.2,
            title: "NewSavedLocation",
            positional_accuracy: 33,
            geoprivacy: "open"
          }
        } )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results[0].id ).to.eq( 1 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "delete", ( ) => {
    it( "should not return anything if successful", function ( done ) {
      nock( "http://localhost:3000" )
        .delete( "/saved_locations/1" )
        .reply( 200 );
      request( this.app ).delete( "/v2/saved_locations/1" )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .expect( 200 )
        .expect( res => {
          expect( res.body ).to.eq( "" );
        } )
        .expect( 200, done );
    } );
  } );
} );
