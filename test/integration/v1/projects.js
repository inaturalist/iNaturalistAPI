const { expect } = require( "chai" );
const request = require( "supertest" );
const _ = require( "lodash" );
const jwt = require( "jsonwebtoken" );
const fs = require( "fs" );
const nock = require( "nock" );
const iNaturalistAPI = require( "../../../lib/inaturalist_api" );
const config = require( "../../../config.js" );

const app = iNaturalistAPI.server( );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Projects Routes", ( ) => {
  describe( "search", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/projects" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 10 );
          expect( res.body.total_results ).to.eq( fixtures.elasticsearch.projects.project.length );
          expect( res.body.results.length ).to.eq( Math.min( 10, fixtures.elasticsearch.projects.project.length ) );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "show", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/projects/1" )
        .expect( res => {
          const project = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( project.id ).to.eq( 1 );
          expect( project.title ).to.eq( "Project One" );
          expect( project.location ).to.eq( "11,12" );
          expect( project.latitude ).to.eq( "11" );
          expect( project.longitude ).to.eq( "12" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns projects by slug", done => {
      request( app ).get( "/v1/projects/project-two" )
        .expect( res => {
          expect( res.body.results[0].slug ).to.eq( "project-two" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns an error if too many IDs are requested", done => {
      const ids = [];
      const count = 101;
      for ( let i = 1; i <= count; i += 1 ) {
        ids.push( i );
      }
      request( app ).get( `/v1/projects/${ids.join( "," )}` )
        .expect( res => {
          expect( res.body.status ).to.eq( 422 );
        } ).expect( "Content-Type", /json/ )
        .expect( 422, done );
    } );
  } );

  describe( "autocomplete", ( ) => {
    it( "returns an empty response if not given a query", done => {
      request( app ).get( "/v1/projects/autocomplete" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 0 );
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( 0 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns partial matches", done => {
      request( app ).get( "/v1/projects/autocomplete?q=proj" )
        .expect( res => {
          const projects = _.filter( fixtures.elasticsearch.projects.project, p => (
            p.title.match( /proj/i )
            && p.project_type !== "collection"
            && p.project_type !== "umbrella"
          ) );
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( projects.length );
          expect( res.body.total_results ).to.eq( projects.length );
          res.body.results = _.sortBy( res.body.results, "id" );
          expect( res.body.results.map( p => p.title ) ).to.include( "Project One" );
          expect( res.body.results.map( p => p.title ) ).to.include( "Project Two" );
          expect( res.body.results.map( p => p.title ) ).to.include( "A Project" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can filter by member_id", done => {
      const userID = 123;
      request( app ).get( `/v1/projects/autocomplete?member_id=${userID}` )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.results.length ).to.eq(
            _.filter(
              fixtures.elasticsearch.projects.project,
              p => ( p.user_ids && p.user_ids.indexOf( userID ) >= 0 )
            ).length
          );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "members", ( ) => {
    it( "returns an error given an unknown project ID", done => {
      request( app ).get( "/v1/projects/888/members" )
        .expect( res => {
          expect( res.body.status ).to.eq( 422 );
        } ).expect( "Content-Type", /json/ )
        .expect( 422, done );
    } );

    it( "returns an empty response if not given a query", done => {
      request( app ).get( "/v1/projects/543/members" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 3 );
          expect( res.body.total_results ).to.eq( 3 );
          expect( res.body.results.length ).to.eq( 3 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "defaults to page 1", done => {
      request( app ).get( "/v1/projects/543/members?page=-1" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 3 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can filter by curators", done => {
      request( app ).get( "/v1/projects/543/members?role=curator" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 2 );
          expect( res.body.results[0].user.id ).to.eq( 123 );
          expect( res.body.results[1].user.id ).to.eq( 6 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can filter by manager", done => {
      request( app ).get( "/v1/projects/543/members?role=manager" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].user.id ).to.eq( 6 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "posts", ( ) => {
    it( "returns posts", done => {
      request( app ).get( "/v1/projects/543/posts" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 2 );
          expect( res.body.results[0].user.id ).to.eq( 1 );
          expect( res.body.results[0].title ).to.not.be.undefined;
          expect( res.body.results[0].body ).to.not.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    // this is really testing code in inatJS, but we need it to conitnue
    // to work for the API, so just being overly cautious
    it( "escapes non-ascii IDs", done => {
      const nonAsciiName = "高中校";
      const escapedName = encodeURI( nonAsciiName );
      const token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      nock( "http://localhost:3000" )
        .put( `/projects/${escapedName}` )
        .reply( 200, { rsp: "success" } );
      request( app ).put( `/v1/projects/${escapedName}`, {
        // it doesn't really matter what we post since we're just stubbing the
        // Rails app to return obs 6 to load from the ES index
      } ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.rsp ).to.eq( "success" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "subscriptions", ( ) => {
    const projectSubscription = _.find( fixtures.postgresql.subscriptions,
      s => s.resource_type === "Project" && s.resource_id === 543 );
    it( "fails for unauthenticated requests", done => {
      request( app ).get( `/v1/projects/${projectSubscription.resource_id}/subscriptions` ).expect( res => {
        expect( res.error.text ).to.eq( "{\"error\":\"Unauthorized\",\"status\":401}" );
      } ).expect( "Content-Type", /json/ )
        .expect( 401, done );
    } );

    it( "returns subscriptions", done => {
      const token = jwt.sign( { user_id: 1 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( app ).get( `/v1/projects/${projectSubscription.resource_id}/subscriptions` ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].user_id ).to.eq( 1 );
          expect( res.body.results[0].resource_id ).to.eq( projectSubscription.resource_id );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "membership", ( ) => {
    const projectUser = fixtures.postgresql.project_users[0];
    const token = jwt.sign( { user_id: projectUser.user_id }, config.jwtSecret || "secret",
      { algorithm: "HS512" } );

    it( "fails for unauthenticated requests", done => {
      request( app ).get( `/v1/projects/${projectUser.project_id}/membership` ).expect( res => {
        expect( res.error.text ).to.eq( "{\"error\":\"Unauthorized\",\"status\":401}" );
      } ).expect( "Content-Type", /json/ )
        .expect( 401, done );
    } );
    it( "returns prefers_curator_coordinate_access_for", done => {
      request( app )
        .get( `/v1/projects/${projectUser.project_id}/membership` )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          const rpu = res.body.results[0];
          expect( rpu.project_id ).to.eq( projectUser.project_id );
          expect( rpu.prefers_curator_coordinate_access_for ).to.eq( "taxon" );
        } )
        .expect( 200, done );
    } );
    it( "returns prefers_curator_coordinate_access_for=none if preference not expressed", done => {
      const projectUserWithoutPreference = _.find( fixtures.postgresql.project_users,
        pu => pu.id === 2 );
      expect( _.find( fixtures.postgresql.preferences, p => (
        p.owner_type === "ProjectUser"
        && p.owner_id === projectUserWithoutPreference.id
        && p.name === "curator_coordinate_access_for"
      ) ) ).to.be.undefined;
      const otherToken = jwt.sign( { user_id: projectUserWithoutPreference.user_id },
        config.jwtSecret || "secret", { algorithm: "HS512" } );
      request( app )
        .get( `/v1/projects/${projectUserWithoutPreference.project_id}/membership` )
        .set( "Authorization", otherToken )
        .expect( 200 )
        .expect( res => {
          const rpu = res.body.results[0];
          expect( rpu.project_id ).to.eq( projectUserWithoutPreference.project_id );
          expect( rpu.prefers_curator_coordinate_access_for ).to.eq( "none" );
        } )
        .expect( 200, done );
    } );
    it( "returns nothing for projects the user has not joined", done => {
      const otherProject = _.find( fixtures.postgresql.projects,
        p => p.id !== projectUser.project_id );
      request( app )
        .get( `/v1/projects/${otherProject.id}/membership` )
        .set( "Authorization", token )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.eq( 0 );
        } )
        .expect( 200, done );
    } );
  } );
} );
