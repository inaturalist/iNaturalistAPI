var expect = require( "chai" ).expect,
    pgClient = require( "../../lib/pg_client" ),
    List = require( "../../lib/models/list" );

describe( "List", function( ) {

  before( function( done ) {
    pgClient.connection.query( "INSERT INTO lists (id, title) VALUES ($1, $2)",
      [ 301, "A List" ], function( ) {
    pgClient.connection.query( "INSERT INTO listed_taxa (taxon_id, list_id) VALUES ($1, $2)",
      [ 401, 301 ], function( ) {
    pgClient.connection.query( "INSERT INTO listed_taxa (taxon_id, list_id) VALUES ($1, $2)",
      [ 402, 301 ], function( ) {
      done( );
    });});});
  });

  describe( "findByID", function( ) {
    it( "returns a project given an ID", function( done ) {
      List.findByID( 301, function( err, l ) {
        expect( l.id ).to.eq( 301 );
        expect( l.title ).to.eq( "A List" );
        done( );
      });
    });

    it( "returns a project from the cache", function( done ) {
      List.findByID( 301, function( err, p ) {
        expect( p.id ).to.eq( 301 );
        expect( p.title ).to.eq( "A List" );
        done( );
      });
    });

    it( "returns false for unknown IDs", function( done ) {
      List.findByID( 10101, function( err, l ) {
        expect( err ).to.eq( null );
        expect( l ).to.be.false;
        done( );
      });
    });
  });

  describe( "taxonIDs", function( ) {
    it( "returns taxonIDs", function( done ) {
      List.findByID( 301, function( err, l ) {
        l.taxonIDs( function( err, ids ) {
          expect( ids.sort( ) ).to.deep.eq([ 401, 402 ]);
          done( );
        });
      });
    });

    it( "returns cached taxonIDs", function( done ) {
      List.findByID( 301, function( err, l ) {
        l.taxonIDs( function( err, ids ) {
          expect( ids.sort( ) ).to.deep.eq([ 401, 402 ]);
          done( );
        });
      });
    });
  });
});
