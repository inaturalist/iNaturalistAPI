var expect = require( "chai" ).expect,
    testHelper = require( "../../lib/test_helper" ),
    Project = require( "../../lib/models/project" );

describe( "Project", function( ) {

  before( function( done ) {
    testHelper.projectWithRules( done );
  });

  describe( "findByID", function( ) {
    it( "returns a project given an ID", function( done ) {
      Project.findByID( 543, function( err, p ) {
        expect( p.id ).to.eq( 543 );
        expect( p.title ).to.eq( "A Project" );
        done( );
      });
    });

    it( "returns a project from the cache", function( done ) {
      Project.findByID( 543, function( err, p ) {
        expect( p.id ).to.eq( 543 );
        expect( p.title ).to.eq( "A Project" );
        done( );
      });
    });

    it( "returns a project given a slug", function( done ) {
      Project.findByID( "a-project", function( err, p ) {
        expect( p.id ).to.eq( 543 );
        expect( p.title ).to.eq( "A Project" );
        done( );
      });
    });

    it( "returns a project given a slug", function( done ) {
      Project.findByID( "'", function( err, p ) {
        expect( err.name ).to.eq( "error" );
        expect( p ).to.be.undefined;
        done( );
      });
    });

    it( "returns null given an unknown ID", function( done ) {
      Project.findByID( 5, function( err, p ) {
        expect( err ).to.eq( null );
        expect( p ).to.eq( false );
        done( );
      });
    });
  });

  describe( "searchParams", function( ) {
    it( "returns false if none exists", function( done ) {
      var p = new Project({ id: "3333" });
      p.projectList( function( err, l ) {
        expect( err ).to.be.null;
        expect( l ).to.be.false;
        done( );
      });
    });
  });

  describe( "searchParams", function( ) {
    it( "returns params for project rules", function( done ) {
      Project.findByID( 543, function( err, p ) {
        p.searchParams( function( err, params) {
          expect( params.d1 ).to.eq( "2016-02-02T02:22:22+00:00" );
          expect( params.d2 ).to.eq( "2016-05-05T05:55:55+00:00" );
          expect( params.identified ).to.eq( "true" );
          expect( params.captive ).to.eq( "false" );
          expect( params.has ).to.deep.eq([ "geo", "photos", "sounds" ]);
          // some of these come from the project list
          expect( params.taxon_ids.sort( ) ).to.deep.eq([ 444, 555, 876, 987 ]);
          expect( params.place_id ).to.deep.eq([ 222, 333 ]);
          expect( params.verifiable ).to.eq( "true" );
          done( );
        });
      });
    });

    it( "can use dates instead of times", function( done ) {
      Project.findByID( 543, function( err, p ) {
        p.date_range_preference = true;
        p.searchParams( function( err, params) {
          expect( params.d1 ).to.eq( "2016-02-02" );
          expect( params.d2 ).to.eq( "2016-05-05" );
          done( );
        });
      });
    });

    it( "doesn't params if the rules don't apply", function( done ) {
      Project.findByID( 543, function( err, p ) {
        p.rules = [ ];
        p.start_time = null;
        p.end_time = null;
        p.list = null;
        p.searchParams( function( err, params) {
          expect( params.d1 ).to.be.undefined;
          expect( params.d2 ).to.be.undefined;
          expect( params.list_id ).to.be.undefined;
          expect( params.taxon_ids ).to.be.undefined;
          expect( params.place_id ).to.be.undefined;
          expect( params.verifiable ).to.be.undefined;
          done( );
        });
      });
    });
  });
});
