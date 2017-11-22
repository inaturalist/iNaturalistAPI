var expect = require( "chai" ).expect,
    Taxon = require( "../lib/models/taxon" ),
    MapServer = require( "../lib/inaturalist_map_server" ),
    MapStyles = require( "../lib/inaturalist_map_styles" ),
    stubReq, stubRes;

function stubRequest( ) {
  return { query: { }, params: { } };
}

function stubResult( ) {
  var res = { headers: { } };
  res.set = function( ) { };
  res.setHeader = function( attr, val ) { res.headers[ attr ] = val; };
  res.status = function( ) { return res; };
  res.send = function( ) { return res; };
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
          aggs: { geohash: { top_hits: {
            _source: { includes: [
              "id", "location", "taxon.iconic_taxon_id", "captive", "quality_grade",
              "geoprivacy", "private_location" ] },
            size: 1, sort: { id: { order: "desc" } } } } },
          geohash_grid: { field: "location", precision: 3, size: 30000 }
        });
        done( );
      });
    });

    it( "uses geohash aggregation for heatmaps", function( done ) {
      stubReq.params.style = "heatmap";
      MapServer.prepareQuery( stubReq, function( ) {
        expect( stubReq.elastic_query.size ).to.eql( 0 );
        expect( stubReq.elastic_query.aggregations.zoom1 ).to.eql({
          aggs: { geohash: { top_hits: {
            _source: { includes: [
              "id", "location", "taxon.iconic_taxon_id", "captive", "quality_grade",
              "geoprivacy", "private_location" ] },
            size: 1, sort: { id: { order: "desc" } } } } },
          geohash_grid: { field: "location", precision: 3, size: 30000 }
        });
        done( );
      });
    });

    it( "returns an error when style is missing", function( done ) {
      MapServer.prepareQuery( stubReq, function( err ) {
        expect( err ).to.eql({ error: "unknown style: undefined", status: 404 });
        done( );
      });
    });

    it( "returns an error when style is unknown", function( done ) {
      stubReq.params.style = "nonsense";
      MapServer.prepareQuery( stubReq, function( err ) {
        expect( err ).to.eql({ error: "unknown style: nonsense", status: 404 });
        done( );
      });
    });

    it( "returns an error when style is unknown for postgis queries", function( done ) {
      stubReq.params.style = "nonsense";
      stubReq.params.dataType = "postgis";
      MapServer.prepareQuery( stubReq, function( err ) {
        expect( err ).to.eql({ error: "unknown style: nonsense", status: 404 });
        done( );
      });
    });

    it( "always sets mappable=true", function( done) {
      stubReq.params.style = "summary";
      MapServer.prepareQuery( stubReq, function( ) {
        expect( stubReq.query.mappable ).to.eql( "true" );
        done( );
      });
    } );

    it( "defaults to captive=false", function( done) {
      stubReq.params.style = "summary";
      MapServer.prepareQuery( stubReq, function( ) {
        expect( stubReq.query.captive ).to.eql( "false" );
        done( );
      });
    } );
    it( "allows captive=true", function( done ) {
      stubReq.params.style = "summary";
      stubReq.query.captive = "true";
      MapServer.prepareQuery( stubReq, function( something, newReq ) {
        expect( newReq.query.captive ).to.eql( "true" );
        done( );
      });
    } );
    it( "allows captive=any", function( done ) {
      stubReq.params.style = "summary";
      stubReq.query.captive = "any";
      MapServer.prepareQuery( stubReq, function( ) {
        expect( stubReq.query.captive ).to.eq( "any" );
        done( );
      });
    } );
  });

  describe( "prepareStyle", function( ) {
    it( "defaults to points markersAndCircles", function( done ) {
      MapServer.prepareStyle( stubReq, function( ) {
        expect( stubReq.style ).to.eql( MapStyles.markersAndCircles( ) );
        done( );
      });
    });

    it( "can specify color of default style", function( done ) {
      stubReq.query.color = "#123FED";
      MapServer.prepareStyle( stubReq, function( ) {
        expect( stubReq.style ).to.eql(
          MapStyles.markersAndCircles( stubReq.query.color ) );
        done( );
      });
    });

    it( "infers color of points from taxon", function( done ) {
      stubReq.inat = { taxon: { iconic_taxon_id: Taxon.iconicTaxonID( "Animalia" ) } };
      MapServer.prepareStyle( stubReq, function( ) {
        expect( stubReq.style ).to.eql(
          MapStyles.markersAndCircles( "#1E90FF" ) );
        done( );
      });
    });

    it( "can set the heatmap style", function( done ) {
      stubReq.params.style = "heatmap";
      MapServer.prepareStyle( stubReq, function( ) {
        expect( stubReq.style ).to.eql( MapStyles.heatmap( ) );
        done( );
      });
    });

    it( "can set the summary style", function( done ) {
      stubReq.params.style = "summary";
      MapServer.prepareStyle( stubReq, function( ) {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredHeatmap( { color: "#6E6E6E", width: 8, opacity: 0.2 } ) );
        done( );
      });
    });

    it( "can set the colored_heatmap style", function( done ) {
      stubReq.params.style = "colored_heatmap";
      MapServer.prepareStyle( stubReq, function( ) {
        expect( stubReq.style ).to.eql( MapStyles.coloredHeatmap( ) );
        done( );
      });
    });

    it( "can specify color of colored_heatmap style", function( done ) {
      stubReq.params.style = "colored_heatmap";
      stubReq.query.color = "#123FED";
      MapServer.prepareStyle( stubReq, function( ) {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredHeatmap( { color: stubReq.query.color } ) );
        done( );
      });
    });

    it( "infers color of colored_heatmap from taxon", function( done ) {
      stubReq.params.style = "colored_heatmap";
      stubReq.inat = { taxon: { iconic_taxon_id: Taxon.iconicTaxonID( "Animalia" ) } };
      MapServer.prepareStyle( stubReq, function( ) {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredHeatmap( { color: "#1E90FF" } ) );
        done( );
      });
    });
  });

  describe( "beforeSendResult", function( ) {
    it( "sets a Cache-Control header", function( done ) {
      stubReq.params.style = "places";
      MapServer.beforeSendResult( stubReq, stubRes, function( ) {
        expect( stubRes.headers["Cache-Control"] ).to.eq( "public, max-age=3600" );
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

  describe( "taxonPlacesQuery", function( ) {
    it( "sets admin_level based on zoom", function( ) {
      var q = MapServer.taxonPlacesQuery({ params: { zoom: 1 } });
      expect( q ).to.include( "p.admin_level = 0" );
      q = MapServer.taxonPlacesQuery({ params: { zoom: 4 } });
      expect( q ).to.include( "p.admin_level = 1" );
      q = MapServer.taxonPlacesQuery({ params: { zoom: 6 } });
      expect( q ).to.include( "p.admin_level = 2" );
      q = MapServer.taxonPlacesQuery({ params: { zoom: 11 } });
      expect( q ).to.include( "p.admin_level = 3" );
    });
  });
});
