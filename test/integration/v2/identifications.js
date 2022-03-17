const _ = require( "lodash" );
const { expect } = require( "chai" );
const request = require( "supertest" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const fs = require( "fs" );
const app = require( "../../../app" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Identifications", ( ) => {
  describe( "create", ( ) => {
    const token = jwt.sign(
      { user_id: 333 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" }
    );
    const ident = fixtures.postgresql.identifications[0];
    const obs = _.find( fixtures.postgresql.observations, o => o.id === ident.observation_id );
    it( "returns JSON", done => {
      nock( "http://localhost:3000" )
        .post( "/identifications" )
        .reply( 200, ident );
      request( app ).post( "/v2/identifications" )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        // it doesn't really matter what we post since we're just stubbing the
        // Rails app to return obs 6 to load from the ES index
        .send( {
          identification: {
            taxon_id: ident.taxon_id,
            observation_id: obs.uuid
          }
        } )
        .expect( 200 )
        .expect( res => {
          const resIdent = res.body.results[0];
          expect( resIdent.id ).to.eq( ident.id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "identifiers", ( ) => {
    it( "return JSON", done => {
      request( app ).get( "/v2/identifications/identifiers" )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.be.greaterThan( 0 );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "update", ( ) => {
    const token = jwt.sign(
      { user_id: 333 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" }
    );
    const ident = fixtures.elasticsearch.identifications.identification[0];
    it( "returns JSON", done => {
      nock( "http://localhost:3000" )
        .put( `/identifications/${ident.uuid}` )
        .reply( 200, ident );
      request( app ).put( `/v2/identifications/${ident.uuid}` )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .send( {
          identification: {
            body: "this is an updated body"
          }
        } )
        .expect( 200 )
        .expect( res => {
          const resIdent = res.body.results[0];
          expect( resIdent.uuid ).to.eq( ident.uuid );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "bails without an identification in the request body", done => {
      nock( "http://localhost:3000" )
        .put( `/identifications/${ident.uuid}` )
        .reply( 200, ident );
      request( app ).put( `/v2/identifications/${ident.uuid}` )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .send( {
          body: "this is an updated body"
        } )
        .expect( 400, done );
    } );
  } );

  describe( "delete", ( ) => {
    const token = jwt.sign(
      { user_id: 333 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" }
    );
    const ident = fixtures.elasticsearch.identifications.identification[0];
    it( "returns 200", done => {
      nock( "http://localhost:3000" )
        .delete( `/identifications/${ident.uuid}?delete=true` )
        .reply( 200 );
      request( app ).delete( `/v2/identifications/${ident.uuid}` )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .expect( 200, done );
    } );
  } );
} );
