var expect = require( "chai" ).expect,
    _ = require( "underscore" ),
    pgClient = require( "../../lib/pg_client" ),
    Project = require( "../../lib/models/project" );

describe( "Project", function( ) {

  describe( "findByID", function( ) {
    before( function( done ) {
      pgClient.connection.query( "TRUNCATE TABLE projects", function( err, result ) {
        pgClient.connection.query( "INSERT INTO projects (id, slug, title) VALUES ($1, $2, $3)",
          [ 123, "a-project", "A Project"], function( err, result ) {
            done( );
        });
      });
    });

    it( "returns a project given an ID", function( done ) {
      Project.findByID( 123, function( err, p ) {
        expect( p.id ).to.eq( 123 );
        expect( p.title ).to.eq( "A Project" );
        done( );
      });
    });

    it( "returns a project from the cache", function( done ) {
      Project.findByID( 123, function( err, p ) {
        expect( p.id ).to.eq( 123 );
        expect( p.title ).to.eq( "A Project" );
        done( );
      });
    });

    it( "returns a project given a slug", function( done ) {
      Project.findByID( "a-project", function( err, p ) {
        expect( p.id ).to.eq( 123 );
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
});
