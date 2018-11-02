const { expect } = require( "chai" );
const Taxon = require( "../lib/models/taxon" );
const MapStyles = require( "../lib/inaturalist_map_styles" );

describe( "InaturalistMapStyles", ( ) => {
  describe( "heatmap", ( ) => {
    it( "returns a style with the right name", ( ) => {
      expect( MapStyles.heatmap( ) ).to.include( "Style name='style'" );
    } );

    it( "uses a heatmap styled colorize-alpha filter", ( ) => {
      expect( MapStyles.heatmap( ) ).to.include( "orange 0.97, red 0.99" );
    } );
  } );

  describe( "coloredPoints", ( ) => {
    it( "defaults to gray", ( ) => {
      expect( MapStyles.markersAndCircles( ) ).to.include( Taxon.defaultColor );
    } );

    it( "uses a heatmap styled colorize-alpha filter", ( ) => {
      expect( MapStyles.markersAndCircles( "#555555" ) ).to.include( "#555555" );
    } );
  } );
} );
