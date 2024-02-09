const { expect } = require( "chai" );
const request = require( "supertest" );
const _ = require( "lodash" );
const jwt = require( "jsonwebtoken" );
const fs = require( "fs" );
const nock = require( "nock" );
const config = require( "../../../config" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Projects", ( ) => {
  describe( "search", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v1/projects" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 10 );
          expect( res.body.total_results ).to.eq( fixtures.elasticsearch.projects.project.length );
          expect( res.body.results.length ).to.eq(
            Math.min( 10, fixtures.elasticsearch.projects.project.length )
          );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "paginates correctly", function ( done ) {
      const perPage = 2;
      expect( fixtures.elasticsearch.projects.project.length ).to.be.above( perPage );
      request( this.app ).get( `/v1/projects?page=2&per_page=${perPage}` )
        .expect( res => {
          expect( res.body.total_results ).to.eq( fixtures.elasticsearch.projects.project.length );
          expect( res.body.results.length ).to.be.above( 0 );
          expect( res.body.results.length ).to.be.below( perPage + 1 );
        } )
        .expect( 200, done );
    } );
    it( "filters by projects with a given ID", function ( done ) {
      request( this.app ).get( "/v1/projects?id=1" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].id ).to.eq( 1 );
        } )
        .expect( 200, done );
    } );
    it( "filters by projects without a given ID", function ( done ) {
      request( this.app ).get( "/v1/projects?id=1&not_id=1" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( 0 );
        } )
        .expect( 200, done );
    } );
    it( "filters by spam true", function ( done ) {
      request( this.app ).get( "/v1/projects?spam=true" )
        .expect( res => {
          const expectedSpamCount = _.filter( fixtures.elasticsearch.projects.project,
            p => p.spam ).length;
          expect( expectedSpamCount ).to.be.above( 0 );
          expect( res.body.total_results ).to.eq( expectedSpamCount );
        } )
        .expect( 200, done );
    } );
    it( "filters by spam false", function ( done ) {
      request( this.app ).get( "/v1/projects?spam=false&per_page=30" )
        .expect( res => {
          const expectedSpamCount = _.filter( fixtures.elasticsearch.projects.project,
            p => !p.spam ).length;
          expect( expectedSpamCount ).to.be.above( 0 );
          expect( res.body.total_results ).to.eq( expectedSpamCount );
        } )
        .expect( 200, done );
    } );
    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v1/projects?q=project-2023092501" )
        .expect( res => {
          const project = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( project.id ).to.eq( 2023092501 );
          expect( project.admins ).not.to.be.undefined;
          expect( project.admins[0] ).not.to.be.undefined;
          expect( project.admins[0].user ).not.to.be.undefined;
          expect( project.admins[0].user.email ).to.be.undefined;
          expect( project.admins[0].user.last_ip ).to.be.undefined;
          expect( project.user ).not.to.be.undefined;
          expect( project.user.email ).to.be.undefined;
          expect( project.user.last_ip ).to.be.undefined;
        } )
        .expect( 200, done );
    } );
  } );

  describe( "show", ( ) => {
    it( "returns json", function ( done ) {
      request( this.app ).get( "/v1/projects/1" )
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

    it( "returns projects by slug", function ( done ) {
      request( this.app ).get( "/v1/projects/project-two" )
        .expect( res => {
          expect( res.body.results[0].slug ).to.eq( "project-two" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns an error if too many IDs are requested", function ( done ) {
      const ids = [];
      const count = 101;
      for ( let i = 1; i <= count; i += 1 ) {
        ids.push( i );
      }
      request( this.app ).get( `/v1/projects/${ids.join( "," )}` )
        .expect( res => {
          expect( res.body.status ).to.eq( 422 );
        } ).expect( "Content-Type", /json/ )
        .expect( 422, done );
    } );

    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v1/projects/2023092501" )
        .expect( res => {
          const project = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( project.id ).to.eq( 2023092501 );
          expect( project.admins ).not.to.be.undefined;
          expect( project.admins[0] ).not.to.be.undefined;
          expect( project.admins[0].user ).not.to.be.undefined;
          expect( project.admins[0].user.email ).to.be.undefined;
          expect( project.admins[0].user.last_ip ).to.be.undefined;
          expect( project.user ).not.to.be.undefined;
          expect( project.user.email ).to.be.undefined;
          expect( project.user.last_ip ).to.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "autocomplete", ( ) => {
    it( "returns an empty response if not given a query", function ( done ) {
      request( this.app ).get( "/v1/projects/autocomplete" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 0 );
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( 0 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns partial matches", function ( done ) {
      request( this.app ).get( "/v1/projects/autocomplete?q=proj" )
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

    it( "can filter by member_id", function ( done ) {
      const userID = 123;
      request( this.app ).get( `/v1/projects/autocomplete?member_id=${userID}` )
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
    it( "per_page correctly", function ( done ) {
      const perPage = 2;
      expect( fixtures.elasticsearch.projects.project.length ).to.be.above( perPage );
      request( this.app ).get( `/v1/projects/autocomplete?q=pr&per_page=${perPage}` )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
          expect( res.body.results.length ).to.be.below( perPage + 1 );
        } )
        .expect( 200, done );
    } );
    it( "filters by not_type", function ( done ) {
      const collectionProj = _.find( fixtures.elasticsearch.projects.project,
        p => p.project_type === "collection" );
      request( this.app )
        .get( `/v1/projects/autocomplete?not_type=umbrella,collection&q=${collectionProj.title}` )
        .expect( res => {
          expect(
            _.filter(
              res.body.results,
              p => p.project_type === "collection" || p.project_type === "umbrella"
            ).length
          ).to.eq( 0 );
        } )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v1/projects/autocomplete?q=2023092501" )
        .expect( res => {
          const project = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( project.id ).to.eq( 2023092501 );
          expect( project.admins ).not.to.be.undefined;
          expect( project.admins[0] ).not.to.be.undefined;
          expect( project.admins[0].user ).not.to.be.undefined;
          expect( project.admins[0].user.email ).to.be.undefined;
          expect( project.admins[0].user.last_ip ).to.be.undefined;
          expect( project.user ).not.to.be.undefined;
          expect( project.user.email ).to.be.undefined;
          expect( project.user.last_ip ).to.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "members", ( ) => {
    it( "returns an error given an unknown project ID", function ( done ) {
      request( this.app ).get( "/v1/projects/888/members" )
        .expect( res => {
          expect( res.body.status ).to.eq( 422 );
        } ).expect( "Content-Type", /json/ )
        .expect( 422, done );
    } );

    it( "returns an empty response if not given a query", function ( done ) {
      request( this.app ).get( "/v1/projects/543/members" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 3 );
          expect( res.body.total_results ).to.eq( 3 );
          expect( res.body.results.length ).to.eq( 3 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "defaults to page 1", function ( done ) {
      request( this.app ).get( "/v1/projects/543/members?page=-1" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 3 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can filter by curators", function ( done ) {
      request( this.app ).get( "/v1/projects/543/members?role=curator" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 2 );
          expect( res.body.results[0].user.id ).to.eq( 123 );
          expect( res.body.results[1].user.id ).to.eq( 6 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can filter by manager", function ( done ) {
      request( this.app ).get( "/v1/projects/543/members?role=manager" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].user.id ).to.eq( 6 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v1/projects/2023092501/members" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 3 );
          expect( res.body.total_results ).to.eq( 3 );
          expect( res.body.results.length ).to.eq( 3 );
          const user1 = _.find( res.body.results, u => u.id === 2023092501 );
          expect( user1 ).not.to.be.undefined;
          expect( user1.email ).to.be.undefined;
          expect( user1.last_ip ).to.be.undefined;
          const user2 = _.find( res.body.results, u => u.id === 2023092502 );
          expect( user2 ).not.to.be.undefined;
          expect( user2.email ).to.be.undefined;
          expect( user2.last_ip ).to.be.undefined;
          const user3 = _.find( res.body.results, u => u.id === 2023092503 );
          expect( user3 ).not.to.be.undefined;
          expect( user3.email ).to.be.undefined;
          expect( user3.last_ip ).to.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "posts", ( ) => {
    it( "returns posts", function ( done ) {
      request( this.app ).get( "/v1/projects/543/posts" )
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
    it( "escapes non-ascii IDs", function ( done ) {
      const nonAsciiName = "高中校";
      const escapedName = encodeURI( nonAsciiName );
      const token = jwt.sign( { user_id: 333 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      nock( "http://localhost:3000" )
        .put( `/projects/${escapedName}` )
        .reply( 200, { rsp: "success" } );
      request( this.app ).put( `/v1/projects/${escapedName}`, {
        // it doesn't really matter what we post since we're just stubbing the
        // Rails app to return obs 6 to load from the ES index
      } ).set( "Authorization", token )
        .expect( res => {
          expect( res.body.rsp ).to.eq( "success" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "never returns email or IP for user in project", function ( done ) {
      request( this.app ).get( "/v1/projects/2023092501/posts" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 3 );
          const user1 = _.find( res.body.results, u => u.id === 2023092501 );
          expect( user1 ).not.to.be.undefined;
          expect( user1.email ).to.be.undefined;
          expect( user1.last_ip ).to.be.undefined;
          const user2 = _.find( res.body.results, u => u.id === 2023092502 );
          expect( user2 ).not.to.be.undefined;
          expect( user2.email ).to.be.undefined;
          expect( user2.last_ip ).to.be.undefined;
          const user3 = _.find( res.body.results, u => u.id === 2023092503 );
          expect( user3 ).not.to.be.undefined;
          expect( user3.email ).to.be.undefined;
          expect( user3.last_ip ).to.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "subscriptions", ( ) => {
    const projectSubscription = _.find( fixtures.postgresql.subscriptions,
      s => s.resource_type === "Project" && s.resource_id === 543 );
    it( "fails for unauthenticated requests", function ( done ) {
      request( this.app ).get( `/v1/projects/${projectSubscription.resource_id}/subscriptions` ).expect( res => {
        expect( res.error.text ).to.eq( "{\"error\":\"Unauthorized\",\"status\":401}" );
      } ).expect( "Content-Type", /json/ )
        .expect( 401, done );
    } );

    it( "returns subscriptions", function ( done ) {
      const token = jwt.sign( { user_id: 1 },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app ).get( `/v1/projects/${projectSubscription.resource_id}/subscriptions` ).set( "Authorization", token )
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
    const token = jwt.sign( { user_id: projectUser.user_id },
      config.jwtSecret || "secret",
      { algorithm: "HS512" } );

    it( "fails for unauthenticated requests", function ( done ) {
      request( this.app ).get( `/v1/projects/${projectUser.project_id}/membership` ).expect( res => {
        expect( res.error.text ).to.eq( "{\"error\":\"Unauthorized\",\"status\":401}" );
      } ).expect( "Content-Type", /json/ )
        .expect( 401, done );
    } );
    it( "returns prefers_curator_coordinate_access_for", function ( done ) {
      request( this.app )
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
    it( "returns prefers_curator_coordinate_access_for=none if preference not expressed", function ( done ) {
      const projectUserWithoutPreference = _.find( fixtures.postgresql.project_users,
        pu => pu.id === 2 );
      expect( _.find( fixtures.postgresql.preferences, p => (
        p.owner_type === "ProjectUser"
        && p.owner_id === projectUserWithoutPreference.id
        && p.name === "curator_coordinate_access_for"
      ) ) ).to.be.undefined;
      const otherToken = jwt.sign( { user_id: projectUserWithoutPreference.user_id },
        config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      request( this.app )
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
    it( "returns nothing for projects the user has not joined", function ( done ) {
      const otherProject = _.find( fixtures.postgresql.projects,
        p => p.id !== projectUser.project_id );
      request( this.app )
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
