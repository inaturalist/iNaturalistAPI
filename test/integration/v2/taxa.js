const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const request = require( "supertest" );
const jwt = require( "jsonwebtoken" );
const config = require( "../../../config.js" );
const app = require( "../../../app" );

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
