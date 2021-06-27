const { photos } = require( "inaturalistjs" );
const { expect } = require( "chai" );
const _ = require( "lodash" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const fs = require( "fs" );
const config = require( "../../../config.js" );
const app = require( "../../../app" );
const testHelper = require( "../../../lib/test_helper" );
const PhotosController = require( "../../../lib/controllers/v1/photos_controller" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "PhotosController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSNoPreload( PhotosController, photos, "create", done );
  } );
  it( "updates", done => {
    const photo = fixtures.postgresql.photos[0];
    const user = _.find( fixtures.postgresql.users, u => u.id === photo.user_id );
    const token = jwt.sign( { user_id: user.id }, config.jwtSecret || "secret",
      { algorithm: "HS512" } );
    nock( "http://localhost:3000" )
      .put( `/photos/${photo.id}` )
      .reply( 200, photo );
    request( app ).put( `/v1/photos/${photo.id}` )
      .set( "Authorization", token )
      .set( "Content-Type", "application/json" )
      .send( {} )
      .expect( 200 )
      .expect( res => {
        const resRecord = res.body;
        expect( resRecord.uuid ).to.eq( photo.uuid );
      } )
      .expect( "Content-Type", /json/ )
      .expect( 200, done );
  } );
} );
