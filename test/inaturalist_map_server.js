const { expect } = require( "chai" );
const Taxon = require( "../lib/models/taxon" );
const MapServer = require( "../lib/inaturalist_map_server" );
const MapStyles = require( "../lib/inaturalist_map_styles" );

let stubReq;
let stubRes;

function stubRequest( ) {
  return { query: { }, params: { } };
}

function stubResult( ) {
  const res = { headers: { } };
  res.set = ( ) => { };
  res.setHeader = ( attr, val ) => { res.headers[attr] = val; };
  res.status = ( ) => res;
  res.send = ( ) => res;
  res.end = ( ) => { };
  return res;
}

describe( "InaturalistMapServer", ( ) => {
  beforeEach( ( ) => {
    stubReq = stubRequest( );
    stubRes = stubResult( );
  } );

  describe( "prepareQuery", ( ) => {
    it( "adds a proper elastic_query for summaries", done => {
      stubReq.params.style = "summary";
      stubReq.params.zoom = 1;
      MapServer.prepareQuery( stubReq, ( ) => {
        expect( stubReq.elastic_query.size ).to.eql( 0 );
        expect( stubReq.elastic_query.aggregations.zoom1 ).to.eql( {
          geotile_grid: {
            field: "location",
            precision: 6,
            size: 10000
          }
        } );
        done( );
      } );
    } );

    it( "uses geohash aggregation for heatmaps", done => {
      stubReq.params.style = "heatmap";
      MapServer.prepareQuery( stubReq, ( ) => {
        expect( stubReq.elastic_query.size ).to.eql( 0 );
        expect( stubReq.elastic_query.aggregations.zoom1 ).to.eql( {
          aggs: {
            geohash: {
              top_hits: {
                _source: {
                  includes: [
                    "id", "location", "taxon.iconic_taxon_id", "captive", "quality_grade",
                    "geoprivacy", "private_location"
                  ]
                },
                size: 1,
                sort: { id: { order: "desc" } }
              }
            }
          },
          geohash_grid: { field: "location", precision: 3, size: 30000 }
        } );
        done( );
      } );
    } );

    it( "returns an error when style is missing", done => {
      MapServer.prepareQuery( stubReq, err => {
        expect( err ).to.eql( { error: "unknown style: undefined", status: 404 } );
        done( );
      } );
    } );

    it( "returns an error when style is unknown", done => {
      stubReq.params.style = "nonsense";
      MapServer.prepareQuery( stubReq, err => {
        expect( err ).to.eql( { error: "unknown style: nonsense", status: 404 } );
        done( );
      } );
    } );

    it( "returns an error when style is unknown for postgis queries", done => {
      stubReq.params.style = "nonsense";
      stubReq.params.dataType = "postgis";
      MapServer.prepareQuery( stubReq, err => {
        expect( err ).to.eql( { error: "unknown style: nonsense", status: 404 } );
        done( );
      } );
    } );

    it( "always sets mappable=true", done => {
      stubReq.params.style = "summary";
      MapServer.prepareQuery( stubReq, ( ) => {
        expect( stubReq.query.mappable ).to.eql( "true" );
        done( );
      } );
    } );

    it( "defaults to captive=false", done => {
      stubReq.params.style = "summary";
      MapServer.prepareQuery( stubReq, ( ) => {
        expect( stubReq.query.captive ).to.eql( "false" );
        done( );
      } );
    } );
    it( "allows captive=true", done => {
      stubReq.params.style = "summary";
      stubReq.query.captive = "true";
      MapServer.prepareQuery( stubReq, ( something, newReq ) => {
        expect( newReq.query.captive ).to.eql( "true" );
        done( );
      } );
    } );
    it( "allows captive=any", done => {
      stubReq.params.style = "summary";
      stubReq.query.captive = "any";
      MapServer.prepareQuery( stubReq, ( ) => {
        expect( stubReq.query.captive ).to.eq( "any" );
        done( );
      } );
    } );
  } );

  describe( "prepareStyle", ( ) => {
    it( "defaults to points markersAndCircles", done => {
      MapServer.prepareStyle( stubReq, ( ) => {
        expect( stubReq.style ).to.eql( MapStyles.markersAndCircles( ) );
        done( );
      } );
    } );

    it( "can specify color of default style", done => {
      stubReq.query.color = "#123FED";
      MapServer.prepareStyle( stubReq, ( ) => {
        expect( stubReq.style ).to.eql(
          MapStyles.markersAndCircles( stubReq.query.color )
        );
        done( );
      } );
    } );

    it( "infers color of points from taxon", done => {
      stubReq.inat = { taxon: { iconic_taxon_id: Taxon.iconicTaxonID( "Animalia" ) } };
      MapServer.prepareStyle( stubReq, ( ) => {
        expect( stubReq.style ).to.eql(
          MapStyles.markersAndCircles( "#1E90FF" )
        );
        done( );
      } );
    } );

    it( "can set the heatmap style", done => {
      stubReq.params.style = "heatmap";
      MapServer.prepareStyle( stubReq, ( ) => {
        expect( stubReq.style ).to.eql( MapStyles.heatmap( ) );
        done( );
      } );
    } );

    it( "can set the summary style", done => {
      stubReq.params.style = "summary";
      MapServer.prepareStyle( stubReq, ( ) => {
        expect( stubReq.style ).to.eql(
          MapStyles.geotilegrid( { color: "#6E6E6E" } )
        );
        done( );
      } );
    } );

    it( "can set the colored_heatmap style", done => {
      stubReq.params.style = "colored_heatmap";
      MapServer.prepareStyle( stubReq, ( ) => {
        expect( stubReq.style ).to.eql( MapStyles.coloredHeatmap( ) );
        done( );
      } );
    } );

    it( "can specify color of colored_heatmap style", done => {
      stubReq.params.style = "colored_heatmap";
      stubReq.query.color = "#123FED";
      MapServer.prepareStyle( stubReq, ( ) => {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredHeatmap( { color: stubReq.query.color } )
        );
        done( );
      } );
    } );

    it( "infers color of colored_heatmap from taxon", done => {
      stubReq.params.style = "colored_heatmap";
      stubReq.inat = { taxon: { iconic_taxon_id: Taxon.iconicTaxonID( "Animalia" ) } };
      MapServer.prepareStyle( stubReq, ( ) => {
        expect( stubReq.style ).to.eql(
          MapStyles.coloredHeatmap( { color: "#1E90FF" } )
        );
        done( );
      } );
    } );
  } );

  describe( "beforeSendResult", ( ) => {
    it( "sets a Cache-Control header", done => {
      stubReq.params.style = "places";
      MapServer.beforeSendResult( stubReq, stubRes, ( ) => {
        expect( stubRes.headers["Cache-Control"] ).to.eq( "public, max-age=3600" );
        done( );
      } );
    } );

    it( "sets a Cache-Control header", done => {
      stubReq.query.ttl = 4;
      MapServer.beforeSendResult( stubReq, stubRes, ( ) => {
        expect( stubRes.headers["Cache-Control"] ).to.eq( "public, max-age=4" );
        done( );
      } );
    } );
  } );

  describe( "placesRoute", ( ) => {
    it( "sets a Cache-Control header", ( ) => {
      MapServer.placesRoute( stubReq, stubRes, ( ) => { } );
      expect( stubReq.params.style ).to.eq( "places" );
      expect( stubReq.params.dataType ).to.eq( "postgis" );
    } );
  } );

  describe( "taxonPlacesRoute", ( ) => {
    it( "sets a Cache-Control header", ( ) => {
      MapServer.taxonPlacesRoute( stubReq, stubRes, ( ) => { } );
      expect( stubReq.params.style ).to.eq( "taxon_places" );
      expect( stubReq.params.dataType ).to.eq( "postgis" );
    } );
  } );

  describe( "taxonRangesRoute", ( ) => {
    it( "sets a Cache-Control header", ( ) => {
      MapServer.taxonRangesRoute( stubReq, stubRes, ( ) => { } );
      expect( stubReq.params.style ).to.eq( "taxon_ranges" );
      expect( stubReq.params.dataType ).to.eq( "postgis" );
    } );
  } );

  describe( "taxonPlacesQuery", ( ) => {
    it( "sets admin_level based on zoom", ( ) => {
      let q = MapServer.taxonPlacesQuery( { params: { zoom: 1 } } );
      expect( q ).to.include( "places.admin_level = 0" );
      q = MapServer.taxonPlacesQuery( { params: { zoom: 4 } } );
      expect( q ).to.include( "places.admin_level = 1" );
      q = MapServer.taxonPlacesQuery( { params: { zoom: 6 } } );
      expect( q ).to.include( "places.admin_level = 2" );
      q = MapServer.taxonPlacesQuery( { params: { zoom: 11 } } );
      expect( q ).to.include( "places.admin_level = 3" );
    } );
  } );
} );
