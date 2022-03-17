const { expect } = require( "chai" );
const _ = require( "lodash" );
const request = require( "supertest" );
const nock = require( "nock" );
const jwt = require( "jsonwebtoken" );
const fs = require( "fs" );
const config = require( "../../../config" );
const app = require( "../../../app" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "ProjectObservationsController", ( ) => {
  const projectObservation = fixtures.postgresql.project_observations[0];
  const project = _.find(
    fixtures.postgresql.projects,
    proj => proj.id === projectObservation.project_id
  );
  const observation = _.find(
    fixtures.postgresql.observations,
    o => o.id === projectObservation.observation_id
  );
  const user = _.find(
    fixtures.elasticsearch.users.user,
    u => u.id === projectObservation.user_id
  );
  const token = jwt.sign(
    { user_id: user.id },
    config.jwtSecret || "secret",
    { algorithm: "HS512" }
  );
  describe( "create", ( ) => {
    it( "should return a ProjectObservation", done => {
      nock( "http://localhost:3000" )
        .post( "/project_observations" )
        .reply( 200, projectObservation );
      request( app ).post( "/v2/project_observations" )
        .set( "Authorization", token )
        .set( "Content-Type", "application/json" )
        .send( {
          project_observation: {
            project_id: project.id,
            observation_id: observation.uuid
          }
        } )
        .expect( 200 )
        .expect( res => {
          const resRecord = res.body.results[0];
          expect( resRecord.uuid ).to.eq( projectObservation.uuid );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
  describe( "destroy", ( ) => {
    it( "should return empty success", done => {
      nock( "http://localhost:3000" )
        .delete( `/project_observations/${projectObservation.uuid}` )
        .reply( 204, projectObservation );
      request( app )
        .delete( `/v2/project_observations/${projectObservation.uuid}` )
        .set( "Authorization", token )
        .expect( 200, done );
    } );
  } );
} );
