const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const request = require( "supertest" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "TaxonNamePriorities", ( ) => {
  const user = _.find( fixtures.postgresql.users, u => u.id === 123 );
  const token = jwt.sign( { user_id: user.id },
    config.jwtSecret || "secret",
    { algorithm: "HS512" } );

  describe( "create", ( ) => {
    it( "should succeed", function ( done ) {
      const stub = {
        id: 1,
        user_id: 123,
        lexicon: "english",
        position: 0
      };
      nock( "http://localhost:3000" )
        .post( "/taxon_name_priorities" )
        .reply( 200, stub );
      request( this.app ).post( "/v2/taxon_name_priorities" )
        .set( "Authorization", token )
        .send( {
          fields: "all",
          taxon_name_priority: {
            lexicon: "english"
          }
        } )
        .expect( res => {
          const resObj = res.body.results[0];
          expect( resObj.id ).to.eq( stub.id );
          expect( resObj.lexicon ).to.eq( stub.lexicon );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "delete", ( ) => {
    it( "should not return anything if successful", function ( done ) {
      nock( "http://localhost:3000" )
        .delete( "/taxon_name_priorities/1" )
        .reply( 200 );
      request( this.app ).delete( "/v2/taxon_name_priorities/1" )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .expect( res => {
          expect( res.body ).to.be.empty;
        } )
        .expect( 200, done );
    } );
  } );
} );
