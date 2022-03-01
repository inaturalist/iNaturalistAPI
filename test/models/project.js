const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const Project = require( "../../lib/models/project" );

const { expect } = chai;
chai.use( chaiAsPromised );

describe( "Project", ( ) => {
  describe( "findByID", ( ) => {
    it( "returns a project given an ID", async ( ) => {
      const p = await Project.findByID( 543 );
      expect( p.id ).to.eq( 543 );
      expect( p.title ).to.eq( "A Project" );
    } );

    it( "returns a project from the cache", async ( ) => {
      const p = await Project.findByID( 543 );
      expect( p.id ).to.eq( 543 );
      expect( p.title ).to.eq( "A Project" );
    } );

    it( "returns a project given a slug", async ( ) => {
      const p = await Project.findByID( "a-project" );
      expect( p.id ).to.eq( 543 );
      expect( p.title ).to.eq( "A Project" );
    } );

    it( "returns false if the slug cannot be queried for", async ( ) => {
      expect( await Project.findByID( "'" ) ).to.be.false;
    } );

    it( "returns null given an unknown ID", async ( ) => {
      const p = await Project.findByID( 5 );
      expect( p ).to.eq( false );
    } );
  } );

  describe( "searchParams", ( ) => {
    it( "returns false if none exists", async ( ) => {
      const p = new Project( { id: "3333" } );
      const l = await p.projectList( );
      expect( l ).to.be.false;
    } );
  } );

  describe( "searchParams", ( ) => {
    it( "returns params for project rules", async ( ) => {
      const p = await Project.findByID( 543 );
      const params = await p.searchParams( );
      expect( params.d1 ).to.eq( "2016-02-02T02:22:22+00:00" );
      expect( params.d2 ).to.eq( "2016-05-05T05:55:55+00:00" );
      expect( params.identified ).to.eq( "true" );
      expect( params.captive ).to.eq( "false" );
      expect( params.has ).to.deep.eq( ["geo", "photos", "sounds"] );
      // some of these come from the project list
      expect( params.taxon_ids.sort( ) ).to.deep.eq( [444, 555, 876, 987] );
      expect( params.place_id ).to.deep.eq( [222, 333] );
      expect( params.verifiable ).to.eq( "true" );
    } );

    it( "can use dates instead of times", async ( ) => {
      const p = await Project.findByID( 543 );
      p.date_range_preference = true;
      const params = await p.searchParams( );
      expect( params.d1 ).to.eq( "2016-02-02" );
      expect( params.d2 ).to.eq( "2016-05-05" );
    } );

    it( "doesn't params if the rules don't apply", async ( ) => {
      const p = await Project.findByID( 543 );
      p.rules = [];
      p.start_time = null;
      p.end_time = null;
      p.list = null;
      const params = await p.searchParams( );
      expect( params.d1 ).to.be.undefined;
      expect( params.d2 ).to.be.undefined;
      expect( params.list_id ).to.be.undefined;
      expect( params.taxon_ids ).to.be.undefined;
      expect( params.place_id ).to.be.undefined;
      expect( params.verifiable ).to.be.undefined;
    } );
  } );
} );
