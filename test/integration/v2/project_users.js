const fs = require( "fs" );
const jwt = require( "jsonwebtoken" );
const nock = require( "nock" );
const request = require( "supertest" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Projects", ( ) => {
  const projectUser = fixtures.postgresql.project_users[0];
  const token = jwt.sign(
    { user_id: projectUser.user_id },
    config.jwtSecret || "secret",
    { algorithm: "HS512" }
  );

  describe( "update", ( ) => {
    it( "requires authentication", function ( done ) {
      request( this.app ).put( `/v2/project_users/${projectUser.id}` )
        .expect( 401, done );
    } );

    it( "should succeed", function ( done ) {
      nock( "http://localhost:3000" )
        .put( `/project_users/${projectUser.id}` )
        .reply( 200, {
          id: projectUser.id
        } );
      request( this.app ).put( `/v2/project_users/${projectUser.id}` ).set( "Authorization", token )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .send( {
          project_user: {
            prefers_curator_coordinate_access_for: "any",
            prefers_updates: false
          }
        } )
        .expect( 200, done );
    } );
  } );
} );
