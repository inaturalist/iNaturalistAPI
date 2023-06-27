const { expect } = require( "chai" );
const MapGenerator = require( "../lib/map_generator" );

describe( "MapGenerator", ( ) => {
  describe( "createMapTemplate", ( ) => {
    it( "fails on invalid styles", async ( ) => {
      await expect( MapGenerator.createMapTemplate(
        { params: { x: 0, y: 0, zoom: 1 }, style: "nonsense" }
      ) ).to.be.rejectedWith( "Unable to process some data while parsing" );
    } );
  } );

  describe( "createMapTemplate", ( ) => {
    it( "returns errors", ( ) => {
      MapGenerator.createMapTemplate( { style: "nothing" }, err => {
        expect( err.message ).to.eq(
          "Cannot read properties of undefined (reading 'format')"
        );
      } );
    } );
  } );

  describe( "geojsonDatasource", ( ) => {
    it( "prepares data for GeoJSON responses", ( ) => {
      const features = [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [12, 11]
          },
          properties: {
            name: "One"
          }
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [22, 21]
          },
          properties: {
            name: "Two"
          }
        }
      ];
      const d = MapGenerator.geojsonDatasource( features );
      expect( d.extent( ) ).to.deep.eq( [12, 11, 22, 21] );
    } );
  } );
} );
