/* eslint no-underscore-dangle: 0 */

const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const _ = require( "lodash" );
const ElasticRequest = require( "../lib/elastic_request" );

const { expect } = chai;
chai.use( chaiAsPromised );

describe( "ElasticRequest", ( ) => {
  describe( "boundingBoxFilter", ( ) => {
    it( "enlarges the boundary for better tile edges", ( ) => {
      expect( ElasticRequest.boundingBoxFilter( { }, [0, 0, 1, 1], true ) ).to.eql( {
        geo_bounding_box: {
          location: {
            bottom_left: [-0.07, -0.07],
            top_right: [1.07, 1.07]
          }
        }
      } );
    } );

    it( "can skip smoothing", ( ) => {
      expect( ElasticRequest.boundingBoxFilter( { }, [0, 0, 1, 1], false ) ).to.eql( {
        geo_bounding_box: {
          location: {
            bottom_left: [0, 0],
            top_right: [1, 1]
          }
        }
      } );
    } );

    it( "creates a conditional query for antimeridian wrapping bboxes", ( ) => {
      expect( ElasticRequest.boundingBoxFilter( { }, [179, 1, -179, 2], false ) ).to.eql( {
        bool: {
          should: [
            {
              geo_bounding_box: {
                location: {
                  bottom_left: [179, 1],
                  top_right: [180, 2]
                }
              }
            },
            {
              geo_bounding_box: {
                location: {
                  bottom_left: [-180, 1],
                  top_right: [-179, 2]
                }
              }
            }
          ]
        }
      } );
    } );
  } );

  describe( "applyBoundingBoxFilter", ( ) => {
    it( "can add to a prefiltered query", ( ) => {
      const req = {
        params: {
          x: 1,
          y: 1,
          zoom: 1
        },
        elastic_query: {
          query: {
            bool: {
              filter: []
            }
          }
        }
      };
      expect( req.elastic_query.query.bool.filter.length ).to.eql( 0 );
      ElasticRequest.applyBoundingBoxFilter( req );
      expect( req.elastic_query.query.bool.filter.length ).to.eql( 1 );
    } );

    it( "can add to a prefiltered bool", ( ) => {
      const req = {
        params: {
          x: 1,
          y: 1,
          zoom: 1
        },
        elastic_query: {
          query: {
            bool: {
              filter: [
                { something: "different" }
              ]
            }
          }
        }
      };
      expect( _.size( req.elastic_query.query.bool.filter ) ).to.eql( 1 );
      ElasticRequest.applyBoundingBoxFilter( req );
      expect( _.size( req.elastic_query.query.bool.filter ) ).to.eql( 2 );
    } );
  } );

  describe( "geohashPrecision", ( ) => {
    it( "returns the proper percision for a zoom", ( ) => {
      expect( ElasticRequest.geohashPrecision( 1 ) ).to.eql( 3 );
      expect( ElasticRequest.geohashPrecision( 2 ) ).to.eql( 3 );
      expect( ElasticRequest.geohashPrecision( 3 ) ).to.eql( 4 );
      expect( ElasticRequest.geohashPrecision( 4 ) ).to.eql( 4 );
      expect( ElasticRequest.geohashPrecision( 5 ) ).to.eql( 4 );
      expect( ElasticRequest.geohashPrecision( 6 ) ).to.eql( 5 );
      expect( ElasticRequest.geohashPrecision( 7 ) ).to.eql( 5 );
      expect( ElasticRequest.geohashPrecision( 8 ) ).to.eql( 6 );
      expect( ElasticRequest.geohashPrecision( 9 ) ).to.eql( 6 );
      expect( ElasticRequest.geohashPrecision( 10 ) ).to.eql( 6 );
      expect( ElasticRequest.geohashPrecision( 11 ) ).to.eql( 7 );
      expect( ElasticRequest.geohashPrecision( 12 ) ).to.eql( 8 );
      expect( ElasticRequest.geohashPrecision( 13 ) ).to.eql( 9 );
      expect( ElasticRequest.geohashPrecision( 14 ) ).to.eql( 9 );
      expect( ElasticRequest.geohashPrecision( 15 ) ).to.eql( 10 );
      expect( ElasticRequest.geohashPrecision( 16 ) ).to.eql( 12 );
    } );
  } );

  describe( "geohashAggregation", ( ) => {
    it( "returns the proper aggregation hash based on zoom", ( ) => {
      expect( ElasticRequest.geohashAggregation( {
        params: { zoom: 15 }
      } ) ).to.eql( {
        zoom1: {
          geohash_grid: {
            field: "location",
            size: 30000,
            precision: 10
          },
          aggs: {
            cellMaxObsID: {
              max: {
                field: "id"
              }
            }
          }
        }
      } );
    } );
  } );
} );
