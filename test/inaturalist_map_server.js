var expect = require( "chai" ).expect,
    MapServer = require( "../lib/inaturalist_map_server" ),
    MapStyles = require( "../lib/inaturalist_map_styles" ),
    req;

function stubRequest( ) {
  return { query: { }, params: { } };
}

function stubResult( ) {
  res = { headers: { } };
  res.set = function( attr, val ) { };
  res.setHeader = function( attr, val ) { res.headers[ attr ] = val; };
  res.status = function( val ) { return res; };
  res.send = function( val ) { return res; };
  res.end = function( ) { };
  return res;
}

describe( "InaturalistMapServer", function( ) {
  beforeEach( function( ) {
    stubReq = stubRequest( );
    stubRes = stubResult( );
  });

  describe( "prepareQuery", function( ) {
    it( "adds a proper elastic_query for summaries", function( done ) {
      stubReq.params.style = "summary";
      MapServer.prepareQuery( stubReq, function( ) {
        expect( stubReq.elastic_query.size ).to.eql( 0 );
        expect( stubReq.elastic_query.aggregations.zoom1 ).to.eql({
          aggs: { geohash: { top_hits: { _source: false,
            fielddata_fields: [
              "id", "location", "taxon.iconic_taxon_id", "captive", "quality_grade",
              "geoprivacy", "private_location" ],
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
              "id", "location", "taxon.iconic_taxon_id", "captive", "quality_grade",
              "geoprivacy", "private_location" ],
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

  describe( "prepareStyle", function( ) {
    it( "defaults to points markersAndCircles", function( done ) {
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql( MapStyles.markersAndCircles( ) );
        done( );
      });
    });

    it( "can specify color of default style", function( done ) {
      stubReq.query.color = "#123FED";
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql(
          MapStyles.markersAndCircles( stubReq.query.color ) );
        done( );
      });
    });

    it( "infers color of points from taxon", function( done ) {
      stubReq.inat = { taxon: { iconic_taxon_id: 1 } };
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql(
          MapStyles.markersAndCircles( "#1E90FF" ) );
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
          MapStyles.coloredHeatmap( "#6E6E6E", 8, 0.2 ) );
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
      stubReq.inat = { taxon: { iconic_taxon_id: 1 } };
      MapServer.prepareStyle( stubReq, function( err, req ) {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredHeatmap( "#1E90FF" ) );
        done( );
      });
    });
  });

  describe( "beforeSendResult", function( ) {
    it( "sets a Cache-Control header", function( done ) {
      stubReq.params.style = "places";
      MapServer.beforeSendResult( stubReq, stubRes, function( ) {
        expect( stubRes.headers["Cache-Control"] ).to.eq( "public, max-age=604800" );
        done( );
      });
    });

    it( "sets a Cache-Control header", function( done ) {
      stubReq.query.ttl = 4;
      MapServer.beforeSendResult( stubReq, stubRes, function( ) {
        expect( stubRes.headers["Cache-Control"] ).to.eq( "public, max-age=4" );
        done( );
      });
    });
  });

  describe( "placesRoute", function( ) {
    it( "sets a Cache-Control header", function( ) {
      MapServer.placesRoute( stubReq, stubRes, function( ) { });
      expect( stubReq.params.style ).to.eq( "places" );
      expect( stubReq.params.dataType ).to.eq( "postgis" );
    });
  });

  describe( "taxonPlacesRoute", function( ) {
    it( "sets a Cache-Control header", function( ) {
      MapServer.taxonPlacesRoute( stubReq, stubRes, function( ) { });
      expect( stubReq.params.style ).to.eq( "taxon_places" );
      expect( stubReq.params.dataType ).to.eq( "postgis" );
    });
  });

  describe( "taxonRangesRoute", function( ) {
    it( "sets a Cache-Control header", function( ) {
      MapServer.taxonRangesRoute( stubReq, stubRes, function( ) { });
      expect( stubReq.params.style ).to.eq( "taxon_ranges" );
      expect( stubReq.params.dataType ).to.eq( "postgis" );
    });
  });

});
