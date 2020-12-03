const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const nock = require( "nock" );
const request = require( "supertest" );
const sinon = require( "sinon" );
const chai = require( "chai" );
const sinonChai = require( "sinon-chai" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config.js" );
const app = require( "../../../app" );
const ComputervisionControllerV1 = require( "../../../lib/controllers/v1/computervision_controller.js" );
const ObservationsControllerV1 = require( "../../../lib/controllers/v1/observations_controller.js" );

chai.use( sinonChai );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Taxa", ( ) => {
  const fixtureTaxon = fixtures.elasticsearch.taxa.taxon[0];
  describe( "show", ( ) => {
    it( "returns json", done => {
      request( app )
        .get( `/v2/taxa/${fixtureTaxon.id}` )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results[0].id ).to.eq( fixtureTaxon.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "supports fields via X-HTTP-Method-Override", done => {
      request( app )
        .post( `/v2/taxa/${fixtureTaxon.id}` )
        .set( "Content-Type", "application/json" )
        .send( {
          fields: { name: true }
        } )
        .set( "X-HTTP-Method-Override", "GET" )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results[0].name ).to.eq( fixtureTaxon.name );
        } )
        .expect( 200, done );
    } );
  } );

  describe( "suggest", ( ) => {
    const token = jwt.sign( { user_id: 123 }, config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    it( "requires auth", done => {
      request( app )
        .get( "/v2/taxa/suggest" )
        .expect( 401, done );
    } );
    it( "returns json", done => {
      request( app )
        .get( "/v2/taxa/suggest" )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.greaterThan( 0 );
        } )
        .expect( 200, done );
    } );
    describe( "with image upload", ( ) => {
      const sandbox = sinon.createSandbox( );
      afterEach( ( ) => sandbox.restore( ) );
      it( "accepts an image and returns results", done => {
        const fakeVisionResults = { 1: 0.01 };
        nock( config.imageProcesing.tensorappURL )
          .post( "/" )
          .reply( 200, fakeVisionResults );
        const scoreImageSpy = sandbox.spy( ComputervisionControllerV1, "scoreImage" );
        const speciesCountsSpy = sandbox.spy( ObservationsControllerV1, "speciesCounts" );
        request( app ).post( "/v2/taxa/suggest" )
          .set( "Content-Type", "multipart/form-data" )
          .set( "Authorization", token )
          .field( "source", "visual" )
          .field( "observed_on", "2020-12-01" )
          .field( "lat", "1" )
          .field( "lng", "1" )
          .field( "locale", "en" )
          // eslint-disable-next-line quotes
          .field( "fields", '{ "taxon": {"name": true, "id": true } }' )
          .attach( "image", "test/fixtures/cuthona_abronia-tagged.jpg" )
          .expect( "Content-Type", /json/ )
          .expect( 200 )
          .expect( res => {
            // Ensure ComputervisionController.scoreImage gets called and not scoreImageURL
            expect( scoreImageSpy ).to.have.been.calledOnce;
            // Ensure lat/lng and observed_on trigger a call to get obs frequencies
            expect( speciesCountsSpy ).to.have.been.calledOnce;
            // Ensure response includes the taxon from vision
            expect( res.body.results[0].taxon.id ).to.eq(
              parseInt( _.keys( fakeVisionResults )[0], 0 )
            );
            // Ensure fields is working on the results
            expect( res.body.results[0].taxon.name ).not.to.be.undefined;
            expect( res.body.results[0].taxon.rank ).to.be.undefined;
          } )
          .expect( 200, done );
      } );
    } );
  } );

  describe( "autocomplete", ( ) => {
    it( "supports fields via X-HTTP-Method-Override", done => {
      const taxon = _.find( fixtures.elasticsearch.taxa.taxon, t => t.name === "Search test taxon" );
      request( app )
        .post( "/v2/taxa/autocomplete" )
        .set( "Content-Type", "application/json" )
        .send( {
          q: taxon.name,
          fields: { name: true }
        } )
        .set( "X-HTTP-Method-Override", "GET" )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results[0].name ).to.eq( taxon.name );
        } )
        .expect( 200, done );
    } );
  } );
} );
