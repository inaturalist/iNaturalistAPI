var expect = require( "chai" ).expect,
    MapServer = require( "../lib/inaturalist_map_server" ),
    MapStyles = require( "../lib/inaturalist_map_styles" ),
    req;

function stubRequest( ) {
  return { query: { }, params: { } };
}

function stubResult( ) {
  return {
    setHeader: function( k, v ) { }
  };
}

describe( "InaturalistAPI", function( ) {
  beforeEach( function( ) {
    stubReq = stubRequest( );
    stubRes = stubResult( );
  });

  describe( "beforePrepareQuery", function( ) {
    it( "does nothing if there is no taxon_id parameter", function( done ) {
      stubReq.query.taxon_id = null;
      MapServer.beforePrepareQuery( stubReq, function( err ) {
        expect( err ).to.be.null;
        done( );
      });
    });

    it( "returns an error if the taxon does nto exist", function( done ) {
      stubReq.query.taxon_id = 1;
      MapServer.beforePrepareQuery( stubReq, function( err ) {
        expect( err ).to.eql({ message: "Unknown taxonID 1", status: 500});
        done( );
      });
    });
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

    it( "does filters out obscured coordinates at zoom 8", function( done ) {
      stubReq.params.zoom = 8;
      MapServer.prepareQuery( stubReq, function( err ) {
        expect( stubReq.elastic_query.query.filtered.filter ).to.eql([
          { not: { exists: { field: "private_location" } } }]);
        done( );
      });
    });
  });

  describe( "prepareStyle", function( ) {
    it( "defaults to points style", function( done ) {
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql( MapStyles.points( ) );
        done( );
      });
    });

    it( "can specify color of points style", function( done ) {
      stubReq.query.color = "#123FED";
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredPoints( stubReq.query.color ) );
        done( );
      });
    });

    it( "infers color of points from taxon", function( done ) {
      stubReq.taxon = { iconic_taxon_id: 1 };
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredPoints( "#1E90FF" ) );
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

    it( "can set the summary style", function( done ) {
      stubReq.params.style = "summary";
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredHeatmap( "#6E6E6E", 8 ) );
        done( );
      });
    });

    it( "can set the colored_heatmap style", function( done ) {
      stubReq.params.style = "colored_heatmap";
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql( MapStyles.coloredHeatmap( ) );
        done( );
      });
    });

    it( "can specify color of colored_heatmap style", function( done ) {
      stubReq.params.style = "colored_heatmap";
      stubReq.query.color = "#123FED";
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredHeatmap( stubReq.query.color ) );
        done( );
      });
    });

    it( "infers color of colored_heatmap from taxon", function( done ) {
      stubReq.params.style = "colored_heatmap";
      stubReq.taxon = { iconic_taxon_id: 1 };
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredHeatmap( "#1E90FF" ) );
        done( );
      });
    });
  });

  describe( "beforeSendResult", function( ) {
    it( "sets a Cache-Control header", function( done ) {
      MapServer.beforeSendResult( stubReq, stubRes, function( ) {
        // this isn't actually testing anything
        done( );
      });
    });
  });
});
