var expect = require( "chai" ).expect,
    MapStyles = require( "../lib/inaturalist_map_styles" );

describe( "InaturalistMapStyles", function( ) {
  describe( "heatmap", function( ) {
    it( "returns a style with the right name", function( ) {
      expect( MapStyles.heatmap( ) ).to.include( "Style name='style'" );
    });

    it( "uses a heatmap styled colorize-alpha filter", function( ) {
      expect( MapStyles.heatmap( ) ).to.include( "orange 0.97, red 0.99" );
    });
  });

  describe( "coloredPoints", function( ) {
    it( "defaults to gray", function( ) {
      expect( MapStyles.coloredPoints( ) ).to.include( "#6E6E6E" );
    });

    it( "uses a heatmap styled colorize-alpha filter", function( ) {
      expect( MapStyles.coloredPoints( "#555555") ).to.include( "#555555" );
    });
  });

  describe( "grid", function( ) {
    it( "returns a style with the right name", function( ) {
      expect( MapStyles.grid( ) ).to.include( "Style name='style'" );
    });
  });

  describe( "points", function( ) {
    it( "returns a style with the right name", function( ) {
      expect( MapStyles.points( ) ).to.include( "Style name='style'" );
    });
  });

});
