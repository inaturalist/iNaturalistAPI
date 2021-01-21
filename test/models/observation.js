const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const fs = require( "fs" );
const moment = require( "moment" );
const sinon = require( "sinon" );
const _ = require( "lodash" );
const Observation = require( "../../lib/models/observation" );
const Project = require( "../../lib/models/project" );
const ProjectUser = require( "../../lib/models/project_user" );

const { expect } = chai;
chai.use( chaiAsPromised );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Observation", ( ) => {
  describe( "removeUnviewableComments", ( ) => {
    let comments;
    beforeEach( ( ) => {
      comments = [
        { id: 1 },
        {
          id: 2,
          flags: [{
            flag: "spam",
            user: { id: 101 }
          }]
        },
        {
          id: 3,
          flags: [{
            flag: "spam",
            user: { id: 102 }
          }]
        }
      ];
    } );

    it( "non-logged-in users see no spam comments", ( ) => {
      const obs = new Observation( { comments } );
      expect( obs.comments.length ).to.eq( 1 );
    } );

    it( "logged-in users see their spam comments", ( ) => {
      // user 101
      let obs = new Observation( { comments },
        { userSession: { user_id: 101 } } );
      expect( obs.comments.length ).to.eq( 2 );
      expect( _.map( obs.comments, "id" ).sort( ) ).to.deep.eq( [1, 2] );

      // user 102
      obs = new Observation( { comments },
        { userSession: { user_id: 102 } } );
      expect( obs.comments.length ).to.eq( 2 );
      expect( _.map( obs.comments, "id" ).sort( ) ).to.deep.eq( [1, 3] );
    } );

    it( "admins see all comments", ( ) => {
      const obs = new Observation( { comments },
        { userSession: { user_id: 1, isAdmin: true } } );
      expect( obs.comments.length ).to.eq( 3 );
      expect( _.map( obs.comments, "id" ).sort( ) ).to.deep.eq( [1, 2, 3] );
    } );

    it( "site curators see all comments", ( ) => {
      const obs = new Observation( { comments },
        { userSession: { user_id: 1, isCurator: true } } );
      expect( obs.comments.length ).to.eq( 3 );
      expect( _.map( obs.comments, "id" ).sort( ) ).to.deep.eq( [1, 2, 3] );
    } );
  } );

  describe( "removeUnviewableGeo", ( ) => {
    describe( "for authenticated collection project curators", ( ) => {
      const fixtureProject = _.find( fixtures.elasticsearch.projects.project,
        p => p.id === 2005 );
      const projectUserTrustingForAny = _.find(
        fixtures.postgresql.project_users,
        pu => pu.id === 7
      );
      const placeId = _.find( fixtureProject.search_parameters,
        sp => sp.field === "place_id" ).value;
      const fixtureObs = _.find( fixtures.elasticsearch.observations.observation, o => (
        o.private_place_ids
        && o.private_place_ids.includes( placeId )
        && o.user.id === projectUserTrustingForAny.user_id
      ) );
      const project = new Project( fixtureProject );
      it( "should not remove unviewable geo for projects that have not been updated recently", ( ) => {
        fixtureObs.non_traditional_projects = [
          {
            project: new Project( project ),
            project_user: Object.assign( {}, projectUserTrustingForAny, {
              prefers_curator_coordinate_access_for: "any"
            } )
          }
        ];
        expect( project.observation_requirements_updated_at ).to.not.be.undefined;
        expect(
          moment( project.observation_requirements_updated_at ).toDate( )
        ).to.be.below( moment( ).subtract( ProjectUser.CURATOR_COORDINATE_ACCESS_WAIT_DAYS, "days" ).toDate( ) );
        expect( fixtureObs.private_location ).to.not.be.undefined;
        const obs = new Observation( fixtureObs, {
          userSession: {
            curated_project_ids: [project.id]
          }
        } );
        expect( obs.private_location ).to.not.be.undefined;
      } );
      it( "should remove unviewable geo for projects that have been updated recently", ( ) => {
        project.observation_requirements_updated_at = moment( ).subtract( 2, "days" ).format( );
        fixtureObs.non_traditional_projects = [
          {
            project: new Project( project ),
            project_user: Object.assign( {}, projectUserTrustingForAny, {
              prefers_curator_coordinate_access_for: "any"
            } )
          }
        ];
        expect(
          moment( project.observation_requirements_updated_at ).toDate( )
        ).to.be.above( moment( ).subtract( ProjectUser.CURATOR_COORDINATE_ACCESS_WAIT_DAYS, "days" ).toDate( ) );
        expect( fixtureObs.private_location ).to.not.be.undefined;
        const obs = new Observation( fixtureObs, {
          userSession: {
            curated_project_ids: [project.id]
          }
        } );
        expect( obs.private_location ).to.be.undefined;
      } );
    } );
  } );

  describe( "preloadAllAssociations", ( ) => {
    it( "returns preload errors", async ( ) => {
      const stub = sinon.stub( Observation, "preloadAnnotationControlledTerms" )
        .callsFake( ( ) => { throw new Error( "terms-error" ); } );
      await expect( Observation.preloadAllAssociations( [], null ) ).to.be.rejectedWith( Error );
      stub.restore( );
    } );
  } );
} );
