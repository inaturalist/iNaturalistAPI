const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config" );
const app = require( "../../../app" );

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
      const fakeVisionResults = { 1: 0.9, 2: 0.1 };
      nock( config.imageProcesing.tensorappURL )
        .post( "/" )
        .reply( 200, fakeVisionResults );
    } );
    it( "returns JSON", done => {
      const token = jwt.sign(
        { user_id: 333 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" }
      );
      request( app ).get( url )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "works with an application token", done => {
      const token = jwt.sign(
        { application: "whatever" },
        config.jwtApplicationSecret || "application_secret",
        { algorithm: "HS512" }
      );
      request( app ).get( url )
        .set( "Authorization", token )
        .expect( 200, done );
    } );
    it( "should fail without a token", done => {
      request( app ).get( url )
        .set( "Authorization", "" )
        .expect( 401, done );
    } );
    it( "should fail without a valid token", done => {
      const token = jwt.sign(
        { application: "whatever" },
        "not the right secret",
        { algorithm: "HS512" }
      );
      request( app ).get( url )
        .set( "Authorization", token )
        .expect( 401, done );
    } );
    it( "should fail without a token that specifies a user or an application", done => {
      const token = jwt.sign(
        { thisIs: "the way" },
        config.jwtApplicationSecret || "application_secret",
        { algorithm: "HS512" }
      );
      request( app ).get( url )
        .set( "Authorization", token )
        .expect( 401, done );
    } );
  } );
  describe( "score_image", ( ) => {
    const token = jwt.sign(
      { user_id: 333 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" }
    );
    beforeEach( ( ) => {
      const fakeVisionResults = { 1: 0.9, 2: 0.1 };
      nock( config.imageProcesing.tensorappURL )
        .post( "/" )
        .reply( 200, fakeVisionResults );
    } );
    it( "returns JSON", done => {
      request( app ).post( "/v2/computervision/score_image" )
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
    it( "allows client to specify fields as JSON", done => {
      request( app ).post( "/v2/computervision/score_image" )
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
