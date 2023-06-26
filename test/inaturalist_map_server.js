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
    it( "adds a proper elastic_query for summaries", async ( ) => {
      stubReq.params.style = "summary";
      stubReq.params.zoom = 1;
      await MapServer.prepareQuery( stubReq );
      expect( stubReq.elastic_query.size ).to.eql( 0 );
      expect( stubReq.elastic_query.aggregations.zoom1 ).to.eql( {
        geotile_grid: {
          field: "location",
          precision: 6,
          size: 10000
        }
      } );
    } );

    it( "uses geohash aggregation for heatmaps", async ( ) => {
      stubReq.params.style = "heatmap";
      await MapServer.prepareQuery( stubReq );
      expect( stubReq.elastic_query.size ).to.eql( 0 );
      expect( stubReq.elastic_query.aggregations.zoom1 ).to.have.key( "geotile_grid" );
    } );

    it( "returns an error when style is missing", async ( ) => {
      await expect( MapServer.prepareQuery( stubReq ) ).to.be
        .rejectedWith( Error, "unknown style: undefined" );
    } );

    it( "returns an error when style is unknown", async ( ) => {
      stubReq.params.style = "nonsense";
      await expect( MapServer.prepareQuery( stubReq ) ).to.be
        .rejectedWith( Error, "unknown style: nonsense" );
    } );

    it( "returns an error when style is unknown for postgis queries", async ( ) => {
      stubReq.params.style = "nonsense";
      stubReq.params.dataType = "postgis";
      await expect( MapServer.prepareQuery( stubReq ) ).to.be
        .rejectedWith( Error, "unknown style: nonsense" );
    } );

    it( "always sets mappable=true", async ( ) => {
      stubReq.params.style = "summary";
      await MapServer.prepareQuery( stubReq );
      expect( stubReq.query.mappable ).to.eql( "true" );
    } );

    it( "allows captive=true", async ( ) => {
      stubReq.params.style = "summary";
      stubReq.query.captive = "true";
      await MapServer.prepareQuery( stubReq );
      expect( stubReq.query.captive ).to.eql( "true" );
    } );

    it( "allows captive=any", async ( ) => {
      stubReq.params.style = "summary";
      stubReq.query.captive = "any";
      await MapServer.prepareQuery( stubReq );
      expect( stubReq.query.captive ).to.eq( "any" );
    } );
  } );

  describe( "prepareStyle", ( ) => {
    it( "defaults to points markersAndCircles", async ( ) => {
      await MapServer.prepareStyle( stubReq );
      expect( stubReq.style ).to.eql( MapStyles.markersAndCircles( ) );
    } );

    it( "can specify color of default style", async ( ) => {
      stubReq.query.color = "#123FED";
      await MapServer.prepareStyle( stubReq );
      expect( stubReq.style ).to.eql(
        MapStyles.markersAndCircles( stubReq.query.color )
      );
    } );

    it( "infers color of points from taxon", async ( ) => {
      stubReq.inat = { taxon: { iconic_taxon_id: Taxon.iconicTaxonID( "Animalia" ) } };
      await MapServer.prepareStyle( stubReq );
      expect( stubReq.style ).to.eql(
        MapStyles.markersAndCircles( "#1E90FF" )
      );
    } );

    it( "can set the heatmap style", async ( ) => {
      stubReq.params.style = "heatmap";
      await MapServer.prepareStyle( stubReq );
      expect( stubReq.style ).to.eql( MapStyles.geotilegridHeatmap( ) );
    } );

    it( "can set the summary style", async ( ) => {
      stubReq.params.style = "summary";
      await MapServer.prepareStyle( stubReq );
      expect( stubReq.style ).to.eql(
        MapStyles.geotilegrid( "#6E6E6E" )
      );
    } );

    it( "can set the colored_heatmap style", async ( ) => {
      stubReq.params.style = "colored_heatmap";
      await MapServer.prepareStyle( stubReq );
      expect( stubReq.style ).to.eql( MapStyles.coloredHeatmap( ) );
    } );

    it( "can specify color of colored_heatmap style", async ( ) => {
      stubReq.params.style = "colored_heatmap";
      stubReq.query.color = "#123FED";
      await MapServer.prepareStyle( stubReq );
      expect( stubReq.style ).to.eql(
        MapStyles.coloredHeatmap( { color: stubReq.query.color } )
      );
    } );

    it( "infers color of colored_heatmap from taxon", async ( ) => {
      stubReq.params.style = "colored_heatmap";
      stubReq.inat = { taxon: { iconic_taxon_id: Taxon.iconicTaxonID( "Animalia" ) } };
      await MapServer.prepareStyle( stubReq );
      expect( stubReq.style ).to.eql(
        MapStyles.coloredHeatmap( { color: "#1E90FF" } )
      );
    } );
  } );

  describe( "beforeSendResult", ( ) => {
    it( "sets a Cache-Control header", async ( ) => {
      stubReq.params.style = "places";
      await MapServer.setCacheHeaders( stubReq, stubRes );
      expect( stubRes.headers["Cache-Control"] ).to.eq( "public, max-age=3600" );
    } );

    it( "sets a Cache-Control header", async ( ) => {
      stubReq.query.ttl = 4;
      await MapServer.setCacheHeaders( stubReq, stubRes );
      expect( stubRes.headers["Cache-Control"] ).to.eq( "public, max-age=4" );
    } );
  } );

  describe( "placesRoute", ( ) => {
    it( "sets a Cache-Control header", ( ) => {
      MapServer.placesRoute( stubReq, stubRes );
      expect( stubReq.params.style ).to.eq( "places" );
      expect( stubReq.params.dataType ).to.eq( "postgis" );
    } );
  } );

  describe( "taxonPlacesRoute", ( ) => {
    it( "sets a Cache-Control header", ( ) => {
      MapServer.taxonPlacesRoute( stubReq, stubRes );
      expect( stubReq.params.style ).to.eq( "taxon_places" );
      expect( stubReq.params.dataType ).to.eq( "postgis" );
    } );
  } );

  describe( "taxonRangesRoute", ( ) => {
    it( "sets a Cache-Control header", ( ) => {
      MapServer.taxonRangesRoute( stubReq, stubRes );
      expect( stubReq.params.style ).to.eq( "taxon_ranges" );
      expect( stubReq.params.dataType ).to.eq( "postgis" );
    } );
  } );

  describe( "taxonPlacesQuery", ( ) => {
    it( "sets admin_level based on zoom", ( ) => {
      let q = MapServer.taxonPlacesQuery( { params: { zoom: 1 } } );
      expect( q ).to.include( "places.admin_level = 0" );
      q = MapServer.taxonPlacesQuery( { params: { zoom: 4 } } );
      expect( q ).to.include( "places.admin_level = 10" );
      q = MapServer.taxonPlacesQuery( { params: { zoom: 6 } } );
      expect( q ).to.include( "places.admin_level = 20" );
      q = MapServer.taxonPlacesQuery( { params: { zoom: 11 } } );
      expect( q ).to.include( "places.admin_level = 30" );
    } );
  } );
} );
