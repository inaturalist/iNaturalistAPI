var expect = require( "chai" ).expect,
    List = require( "../../lib/models/list" );

describe( "List", function( ) {

  describe( "findByID", function( ) {
    it( "returns a list given an ID", function( done ) {
      List.findByID( 301, function( err, l ) {
        expect( l.id ).to.eq( 301 );
        expect( l.title ).to.eq( "A List" );
        done( );
      });
    });

    it( "returns a list from the cache", function( done ) {
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
