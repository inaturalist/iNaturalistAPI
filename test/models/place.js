var expect = require( "chai" ).expect,
    _ = require( "underscore" ),
    esClient = require( "../../lib/es_client" ),
    Place = require( "../../lib/models/place" );

describe( "Place", function( ) {

  describe( "constructor", function( ) {
    it( "creates a place", function( ) {
      var p = new Place({ id: 111, name: "itsname" });
      expect( p.id ).to.eq( 111 );
      expect( p.name ).to.eq( "itsname" );
    });
  });

  describe( "findByID", function( ) {
    before( function( done ) {
      esClient.connection.create({
        index: "test_places",
        type: "place",
        body: { id: 123, name: "itsname" },
        refresh: true,
      }, function( err, response ) {
        done( );
      });
    });

    it( "returns a place given an ID", function( done ) {
      Place.findByID( 123, function( err, p ) {
        expect( p.id ).to.eq( 123 );
        expect( p.name ).to.eq( "itsname" );
        done( );
      });
    });

    it( "returns a place from the cache", function( done ) {
      Place.findByID( 123, function( err, p ) {
        expect( p.id ).to.eq( 123 );
        expect( p.name ).to.eq( "itsname" );
        done( );
      });
    });

    it( "returns an error given a bad ID", function( done ) {
      Place.findByID( "notanint", function( err, t ) {
        expect( err ).to.deep.eq({ messsage: "invalid place_id", status: "422" });
        done( );
      });
    });

    it( "returns null given an unknown ID", function( done ) {
      Place.findByID( 5, function( err, p ) {
        expect( err ).to.eq( null );
        expect( p ).to.eq( false );
        done( );
      });
    });
  });
});
