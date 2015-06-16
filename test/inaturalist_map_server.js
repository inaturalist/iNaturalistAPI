var expect = require( "chai" ).expect,
    MapServer = require( "../lib/inaturalist_map_server" ),
    MapStyles = require( "../lib/inaturalist_map_styles" ),
    req;

function stubRequest( ) {
  return { query: { }, params: { } };
}

describe( "InaturalistAPI", function( ) {
  beforeEach( function( ) {
    stubReq = stubRequest( );
  });

  describe( "prepareQuery", function( ) {
    it( "adds a proper elastic_query for summaries", function( done ) {
      stubReq.params.style = "summary";
      MapServer.prepareQuery( stubReq, function( ) {
        expect( stubReq.elastic_query.size ).to.eql( 0 );
        expect( stubReq.elastic_query.aggregations.zoom1 ).to.eql({
          aggs: { geohash: { top_hits: { _source: false,
            fielddata_fields: [
            "id", "location", "taxon.iconic_taxon_id", "captive", "quality_grade" ],
            size: 1, sort: { id: { order: "desc" } } } } },
          geohash_grid: { field: "location", precision: 3, size: 50000 }
        });
        done( );
      });
    });

    it( "uses geohash aggregation for heatmaps", function( done ) {
      stubReq.params.style = "heatmap";
      MapServer.prepareQuery( stubReq, function( ) {
        expect( stubReq.elastic_query.size ).to.eql( 0 );
        expect( stubReq.elastic_query.aggregations.zoom1 ).to.eql({
          aggs: { geohash: { top_hits: { _source: false,
            fielddata_fields: [
            "id", "location", "taxon.iconic_taxon_id", "captive", "quality_grade" ],
            size: 1, sort: { id: { order: "desc" } } } } },
          geohash_grid: { field: "location", precision: 3, size: 50000 }
        });
        done( );
      });
    });

    it( "returns an error when style is missing", function( done ) {
      MapServer.prepareQuery( stubReq, function( err ) {
        expect( err ).to.eql({ message: "unknown style: undefined", status: 404 });
        done( );
      });
    });

    it( "returns an error when style is unknown", function( done ) {
      stubReq.params.style = "nonsense";
      MapServer.prepareQuery( stubReq, function( err ) {
        expect( err ).to.eql({ message: "unknown style: nonsense", status: 404 });
        done( );
      });
    });
  });

  describe( "prepareQuery", function( ) {
    it( "defaults to points style", function( done ) {
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql( MapStyles.points( ) );
        done( );
      });
    });

    it( "can set the heatmap style", function( done ) {
      stubReq.params.style = "heatmap";
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql( MapStyles.heatmap( ) );
        done( );
      });
    });
  });

});
