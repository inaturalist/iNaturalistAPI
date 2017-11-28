var expect = require( "chai" ).expect,
    Taxon = require( "../lib/models/taxon" ),
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
      expect( MapStyles.markersAndCircles( ) ).to.include( Taxon.defaultColor );
    });

    it( "uses a heatmap styled colorize-alpha filter", function( ) {
      expect( MapStyles.markersAndCircles( "#555555") ).to.include( "#555555" );
    });
  });

});
