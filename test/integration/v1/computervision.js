const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );

describe( "Computervision", ( ) => {
  describe( "score_image", ( ) => {
    it( "accepts an image in a multipart request", function ( done ) {
      const token = jwt.sign( { user_id: 333 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      const fakeVisionResults = { 1: 0.01 };
      nock( config.imageProcesing.tensorappURL )
        .post( "/" )
        .reply( 200, fakeVisionResults );
      // Not testing response, just the fact that it accepts and image and
      // responds with success
      request( this.app ).post( "/v1/computervision/score_image" )
        .attach( "image", "test/fixtures/cuthona_abronia-tagged.jpg" )
        .set( "Authorization", token )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "taxon_geomodel_bounds", ( ) => {
    it( "returns JSON", function ( done ) {
      nock( config.imageProcesing.tensorappURL )
        .get( "/h3_04_bounds?taxon_id=1" )
        .reply( 200, { } );
      request( this.app ).get( "/v1/computervision/taxon_geomodel_bounds/1" )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
