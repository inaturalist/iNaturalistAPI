const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Computervision", ( ) => {
  describe( "score_observation", ( ) => {
    const obsPhoto = fixtures.postgresql.observation_photos[0];
    const fixtureObs = _.find(
      fixtures.elasticsearch.observations.observation,
      o => o.id === obsPhoto.observation_id
    );
    const url = `/v2/computervision/score_observation/${fixtureObs.uuid}`;
    beforeEach( ( ) => {
      const fakeVisionResults = {
        results: [{
          id: 1,
          combined_score: 0.9,
          geo_score: 0.9,
          geo_threshold: 1.0,
          vision_score: 0.9
        }, {
          id: 2,
          combined_score: 0.1,
          geo_score: 0.1,
          geo_threshold: 0.5,
          vision_score: 0.1
        }]
      };
      nock( config.imageProcesing.tensorappURL )
        .post( "/" )
        .reply( 200, fakeVisionResults );
      nock( "https://static.inaturalist.org/photos/1" )
        .get( "/medium.jpeg" )
        .reply( 200, fs.readFileSync( "test/fixtures/cuthona_abronia-tagged.jpg" ) );
    } );
    it( "returns JSON", function ( done ) {
      const token = jwt.sign(
        { user_id: 333 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" }
      );
      request( this.app ).get( url )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "works with an application token", function ( done ) {
      const token = jwt.sign(
        { application: "whatever" },
        config.jwtApplicationSecret || "application_secret",
        { algorithm: "HS512" }
      );
      request( this.app ).get( url )
        .set( "Authorization", token )
        .expect( 200, done );
    } );
    it( "should fail without a token", function ( done ) {
      request( this.app ).get( url )
        .set( "Authorization", "" )
        .expect( 401, done );
    } );
    it( "should fail without a valid token", function ( done ) {
      const token = jwt.sign(
        { application: "whatever" },
        "not the right secret",
        { algorithm: "HS512" }
      );
      request( this.app ).get( url )
        .set( "Authorization", token )
        .expect( 401, done );
    } );
    it( "should fail without a token that specifies a user or an application", function ( done ) {
      const token = jwt.sign(
        { thisIs: "the way" },
        config.jwtApplicationSecret || "application_secret",
        { algorithm: "HS512" }
      );
      request( this.app ).get( url )
        .set( "Authorization", token )
        .expect( 401, done );
    } );
    it( "filters for photo id if provided", function ( done ) {
      const token = jwt.sign(
        { application: "whatever" },
        config.jwtApplicationSecret || "application_secret",
        { algorithm: "HS512" }
      );
      request( this.app ).get( `${url}?photo_id=1` )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
        } )
        .expect( 200, done );
    } );
    it( "should fail when given a photo id not attributed to the observation", function ( done ) {
      const token = jwt.sign(
        { application: "whatever" },
        config.jwtApplicationSecret || "application_secret",
        { algorithm: "HS512" }
      );
      request( this.app ).get( `${url}?photo_id=2020101601` )
        .set( "Authorization", token )
        .expect( 422, done );
    } );
  } );
  describe( "score_image", ( ) => {
    const token = jwt.sign(
      { user_id: 333 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" }
    );
    beforeEach( ( ) => {
      const fakeVisionResults = {
        results: [{
          id: 1,
          combined_score: 0.9,
          geo_score: 0.9,
          geo_threshold: 1.0,
          vision_score: 0.9
        }, {
          id: 2,
          combined_score: 0.1,
          geo_score: 0.1,
          geo_threshold: 0.5,
          vision_score: 0.1
        }]
      };
      nock( config.imageProcesing.tensorappURL )
        .post( "/" )
        .reply( 200, fakeVisionResults );
    } );
    it( "returns JSON", function ( done ) {
      request( this.app ).post( "/v2/computervision/score_image" )
        .set( "Authorization", token )
        .set( "Content-Type", "multipart/form-data" )
        .field( "fields", "id,uuid" )
        .attach( "image", "test/fixtures/cuthona_abronia-tagged.jpg" )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "allows client to specify fields as JSON", function ( done ) {
      request( this.app ).post( "/v2/computervision/score_image" )
        .set( "Authorization", token )
        .set( "Content-Type", "multipart/form-data" )
        .field( "fields", JSON.stringify( {
          taxon: ["id", "uuid", "name"]
        } ) )
        .attach( "image", "test/fixtures/cuthona_abronia-tagged.jpg" )
        .expect( 200 )
        .expect( res => {
          const { taxon } = res.body.results[0];
          expect( taxon.id ).not.to.be.undefined;
          expect( taxon.uuid ).not.to.be.undefined;
          expect( taxon.name ).not.to.be.undefined;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
