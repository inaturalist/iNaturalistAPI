var expect = require( "chai" ).expect,
    MapStyles = require( "../lib/inaturalist_map_styles" );

describe( "InaturalistMapStyles", function( ) {
  describe( "heatmap", function( ) {
    it( "returns a style with the right name", function( ) {
      expect( MapStyles.heatmap( ) ).to.include( "Style name='style'" );
    });

    it( "uses a heatmap styled colorize-alpha filter", function( ) {
      expect( MapStyles.heatmap( ) ).to.include( "orange, red" );
    });

    it( "allows custom colors to be specified", function( ) {
      expect( MapStyles.heatmap( "purple" ) ).to.include( "purple" );
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
