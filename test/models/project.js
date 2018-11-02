const { expect } = require( "chai" );
const Project = require( "../../lib/models/project" );

describe( "Project", ( ) => {
  describe( "findByID", ( ) => {
    it( "returns a project given an ID", done => {
      Project.findByID( 543, ( err, p ) => {
        expect( p.id ).to.eq( 543 );
        expect( p.title ).to.eq( "A Project" );
        done( );
      } );
    } );

    it( "returns a project from the cache", done => {
      Project.findByID( 543, ( err, p ) => {
        expect( p.id ).to.eq( 543 );
        expect( p.title ).to.eq( "A Project" );
        done( );
      } );
    } );

    it( "returns a project given a slug", done => {
      Project.findByID( "a-project", ( err, p ) => {
        expect( p.id ).to.eq( 543 );
        expect( p.title ).to.eq( "A Project" );
        done( );
      } );
    } );

    it( "returns a project given a slug", done => {
      Project.findByID( "'", ( err, p ) => {
        expect( err.name ).to.eq( "error" );
        expect( p ).to.be.undefined;
        done( );
      } );
    } );

    it( "returns null given an unknown ID", done => {
      Project.findByID( 5, ( err, p ) => {
        expect( err ).to.eq( null );
        expect( p ).to.eq( false );
        done( );
      } );
    } );
  } );

  describe( "searchParams", ( ) => {
    it( "returns false if none exists", done => {
      const p = new Project( { id: "3333" } );
      p.projectList( ( err, l ) => {
        expect( err ).to.be.null;
        expect( l ).to.be.false;
        done( );
      } );
    } );
  } );

  describe( "searchParams", ( ) => {
    it( "returns params for project rules", done => {
      Project.findByID( 543, ( err, p ) => {
        p.searchParams( ( errr, params ) => {
          expect( params.d1 ).to.eq( "2016-02-02T02:22:22+00:00" );
          expect( params.d2 ).to.eq( "2016-05-05T05:55:55+00:00" );
          expect( params.identified ).to.eq( "true" );
          expect( params.captive ).to.eq( "false" );
          expect( params.has ).to.deep.eq( ["geo", "photos", "sounds"] );
          // some of these come from the project list
          expect( params.taxon_ids.sort( ) ).to.deep.eq( [444, 555, 876, 987] );
          expect( params.place_id ).to.deep.eq( [222, 333] );
          expect( params.verifiable ).to.eq( "true" );
          done( );
        } );
      } );
    } );

    it( "can use dates instead of times", done => {
      Project.findByID( 543, ( err, p ) => {
        p.date_range_preference = true;
        p.searchParams( ( errr, params ) => {
          expect( params.d1 ).to.eq( "2016-02-02" );
          expect( params.d2 ).to.eq( "2016-05-05" );
          done( );
        } );
      } );
    } );

    it( "doesn't params if the rules don't apply", done => {
      Project.findByID( 543, ( err, p ) => {
        p.rules = [];
        p.start_time = null;
        p.end_time = null;
        p.list = null;
        p.searchParams( ( errr, params ) => {
          expect( params.d1 ).to.be.undefined;
          expect( params.d2 ).to.be.undefined;
          expect( params.list_id ).to.be.undefined;
          expect( params.taxon_ids ).to.be.undefined;
          expect( params.place_id ).to.be.undefined;
          expect( params.verifiable ).to.be.undefined;
          done( );
        } );
      } );
    } );
  } );
} );
