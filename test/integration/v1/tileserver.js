var request = require( "supertest" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

describe( "Tileserver", function( ) {

  describe( "taxon places", function( ) {
    it( "renders taxon place tiles", function( done ) {
      request( app ).get( "/v1/taxon_places/1/1/0/0.png" ).
      expect( "Content-Type", /png/ ).
      expect( 200, done );
    });
  });

  describe( "taxon ranges", function( ) {
    it( "renders taxon range tiles", function( done ) {
      request( app ).get( "/v1/taxon_ranges/1/1/0/0.png" ).
      expect( "Content-Type", /png/ ).
      expect( 200, done );
    });
  });

  describe( "places", function( ) {
    it( "renders place tiles", function( done ) {
      request( app ).get( "/v1/places/1/1/0/0.png" ).
      expect( "Content-Type", /png/ ).
      expect( 200, done );
    });
  });

  describe( "summary", function( ) {
    it( "renders summary tiles", function( done ) {
      request( app ).get( "/v1/summary/1/0/0.png" ).
      expect( "Content-Type", /png/ ).
      expect( 200, done );
    });
  });

  describe( "heatmap", function( ) {
    it( "renders heatmap tiles", function( done ) {
      request( app ).get( "/v1/heatmap/1/0/0.png" ).
      expect( "Content-Type", /png/ ).
      expect( 200, done );
    });
  });

  describe( "colored heatmap", function( ) {
    it( "renders colored_heatmap tiles", function( done ) {
      request( app ).get( "/v1/colored_heatmap/1/0/0.png" ).
      expect( "Content-Type", /png/ ).
      expect( 200, done );
    });
  });

  describe( "points", function( ) {
    it( "renders points tiles", function( done ) {
      request( app ).get( "/v1/points/1/0/0.png" ).
      expect( "Content-Type", /png/ ).
      expect( 200, done );
    });
  });
});
