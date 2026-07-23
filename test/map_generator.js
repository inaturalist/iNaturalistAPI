const _ = require( "lodash" );
const { expect } = require( "chai" );
const chroma = require( "chroma-js" );
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

  describe( "h3CountsToGeoJSON", ( ) => {
    it( "returns an array of GeoJSON objects given an object keyed by h3 indices", ( ) => {
      const colorScale = chroma.scale( ["white", "black"] );
      const cellValue = 0.5;
      const indices = {
        "843e629ffffffff": cellValue
      };
      const geoJSON = MapGenerator.h3CountsToGeoJSON( indices, colorScale );
      expect( geoJSON ).to.be.an( "array" );
      expect( geoJSON.length ).to.eq( 1 );
      expect( geoJSON[0].type ).to.eq( "Feature" );
      expect( geoJSON[0].properties ).to.be.an( "object" );
      expect( geoJSON[0].properties.value ).to.eq( cellValue );
      expect( geoJSON[0].properties.color ).to.eq( colorScale( cellValue ).hex( ) );
      expect( geoJSON[0].geometry ).to.be.an( "object" );
      expect( geoJSON[0].geometry.type ).to.eq( "Polygon" );

      const { coordinates } = geoJSON[0].geometry;
      expect( coordinates ).to.be.an( "array" );
      expect( coordinates.length ).to.eq( 1 );
      expect( coordinates[0] ).to.be.an( "array" );
      // each h3 cell has 6 points, and GeoJSON should start and end with the same point
      expect( _.first( coordinates[0] ) ).to.deep.eq( _.last( coordinates[0] ) );
      expect( coordinates[0].length ).to.eq( 7 );
      expect( coordinates[0][0] ).to.be.an( "array" );
      expect( coordinates[0][0].length ).to.eq( 2 );
      // the coordinate for this cell have both lat and lng between 30 and 32
      expect( coordinates[0][0][0] ).to.be.within( 30, 32 );
      expect( coordinates[0][0][1] ).to.be.within( 30, 32 );
    } );

    it( "returns a GeoJSON MultiPolygon for an h3 index that crosses the antimeridian", ( ) => {
      const colorScale = chroma.scale( ["white", "black"] );
      const cellValue = 0.5;
      const indices = {
        "8405481ffffffff": cellValue
      };
      const geoJSON = MapGenerator.h3CountsToGeoJSON( indices, colorScale );
      expect( geoJSON ).to.be.an( "array" );
      expect( geoJSON[0].geometry ).to.be.an( "object" );
      expect( geoJSON[0].geometry.type ).to.eq( "MultiPolygon" );

      const { coordinates } = geoJSON[0].geometry;
      expect( coordinates ).to.be.an( "array" );
      expect( coordinates.length ).to.eq( 2 );
      // there should be two sets of coordinates, split at the antimeridian. The first will
      // have very high longitude values and the second will have very low longitude values
      expect( _.first( coordinates[0][0] ) ).to.deep.eq( _.last( coordinates[0][0] ) );
      expect( _.max( _.map( coordinates[0][0], _.first ) ) ).to.eq( 180 );
      expect( _.min( _.map( coordinates[0][0], _.first ) ) ).to.be.above( 177 );
      expect( _.first( coordinates[1][0] ) ).to.deep.eq( _.last( coordinates[1][0] ) );
      expect( _.max( _.map( coordinates[1][0], _.first ) ) ).to.be.below( -177 );
      expect( _.min( _.map( coordinates[1][0], _.first ) ) ).to.eq( -180 );
    } );
  } );
} );
