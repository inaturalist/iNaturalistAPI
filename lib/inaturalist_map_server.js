"use strict";
var ElasticMapper = require( "elasticmaps" ),
    squel = require( "squel" ),
    MapStyles = require( "./inaturalist_map_styles" ),
    esClient = require( "./es_client" ),
    util = require( "./util" ),
    InaturalistAPI = require( "./inaturalist_api" ),
    Taxon = require( "./models/taxon" ),
    ObservationsController = require( "./controllers/v1/observations_controller" );

var InaturalistMapserver = { };

InaturalistMapserver.taxonPlacesQuery = function( req ) {
  var admin_level = 0;
  // admin_level corresponds to specificity of location. As the user zooms in,
  // we want more specific locations (e.g. Country -> State -> County...)
  if( req.params.zoom >= 11 ) {
    admin_level = 3;
  } else if( req.params.zoom >= 6 ) {
    admin_level = 2;
  } else if( req.params.zoom >= 4 ) {
    admin_level = 1;
  }

  const query = squel.select( ).
    field( "geom" ).
    field( "MAX(listed_taxa.last_observation_id) as last_observation_id" ).
    field( "MAX(listed_taxa.occurrence_status_level) as occurrence_status_level" ).
    field( "MAX(listed_taxa.establishment_means) as establishment_means" ).
    from( "place_geometries" ).
    join( "places", null, "places.id = place_geometries.place_id" ).
    join( "listed_taxa", null, "listed_taxa.place_id = places.id" ).
    where( "listed_taxa.taxon_id IN ?", util.paramArray( req.params.taxon_id ) || [ "null" ] ).
    where( "places.admin_level = ?", admin_level ).
    group( "geom" );
  return `(${query.toString( )}) AS places`;
};

InaturalistMapserver.taxonRangesQuery = function( req ) {
  const query = squel.select( ).
    field( "geom" ).
    from( "taxon_ranges" ).
    where( "taxon_id IN ?", util.paramArray( req.params.taxon_id ) );
  return `(${query.toString( )}) AS places`;
};

InaturalistMapserver.placesQuery = function( req ) {
  const query = squel.select( ).
    field( "geom" ).
    from( "place_geometries" ).
    where( "place_id IN ?", util.paramArray( req.params.place_id ) );
  return `(${query.toString( )}) AS places`;
};

InaturalistMapserver.prepareQuery = function( req, callback ) {
  req.elastic_query = { };
  if( req.params.dataType === "postgis" ) {
    req.postgis = { };
    if( req.params.style === "taxon_places" ) {
      req.postgis.query = InaturalistMapserver.taxonPlacesQuery( req );
    } else if( req.params.style === "taxon_ranges" ) {
      req.postgis.query = InaturalistMapserver.taxonRangesQuery( req );
    } else if( req.params.style === "places" ) {
      req.postgis.query = InaturalistMapserver.placesQuery( req );
    } else {
      return callback( { error: "unknown style: " +
        req.params.style, status: 404 }, req );
    }
    return callback( null, req );
  }
  req.elastic_query.sort = { id: "desc" };
  req.query.source = { includes: InaturalistAPI.defaultMapFields( ) };
  // requiring mappable=true to be included in map tiles
  req.query.mappable = "true";
  if( !req.query.captive || ( req.query.captive !== "any" && req.query.captive !== "true" ) ) {
    req.query.captive = "false";
  }
  ObservationsController.reqToElasticQuery( req, function( err, query ) {
    var elastic_query = query;
    var searchHash = esClient.searchHash( elastic_query );
    req.elastic_query.query = searchHash.query;

    switch( req.params.style ) {
      case "heatmap":
      case "colored_heatmap":
      case "summary":
      case "points":
        req.elastic_query.size = 0;
        if ( req.params.format === "torque.json" ) {
          req.elastic_query.aggregations = ElasticMapper.torqueAggregation( req );
        } else {
          req.elastic_query.aggregations = ElasticMapper.geohashAggregation( req );
        }
        break;
      default:
        return callback( { error: "unknown style: " +
          req.params.style, status: 404 }, req );
    }
    callback( null, req );
  });
};

InaturalistMapserver.prepareStyle = function( req, callback ) {
  req.inat = req.inat || { };
  var color;
  switch( req.params.style ) {
    case "heatmap":
      req.style = MapStyles.heatmap( req.query.color );
      break;
    case "summary":
      req.style = MapStyles.coloredHeatmap( { color: "#6E6E6E", width: 8, opacity: 0.2 } );
      break;
    case "colored_heatmap":
      var tileOptions = Object.assign( { }, req.query );
      if( req.inat.taxon && !req.query.color ) {
        tileOptions.color = Taxon.iconicTaxonColor( req.inat.taxon.iconic_taxon_id );
      }
      req.style = MapStyles.coloredHeatmap( tileOptions );
      break;
    case "taxon_places":
      req.style = MapStyles.taxonPlaces( );
      break;
    case "taxon_ranges":
      req.style = MapStyles.taxonRange( req.query.color );
      break;
    case "places":
      req.style = MapStyles.places( );
      break;
    default:
      if( req.query.color ) {
        color = req.query.color;
      } else if( req.inat.taxon ) {
        color = Taxon.iconicTaxonColor( req.inat.taxon.iconic_taxon_id );
      }
      if( color ) { req.style = MapStyles.markersAndCircles( color ); }
      else { req.style = MapStyles.markersAndCircles( ); }
  }
  callback( null, req );
};

InaturalistMapserver.beforeSendResult = function( req, res, callback ) {
  if( req.query.ttl && Number( req.query.ttl ) ) {
    res.setHeader( "Cache-Control",
      "public, max-age=" + Number( req.query.ttl) );
  } else {
    switch( req.params.style ) {
      case "summary":
        res.setHeader( "Cache-Control", "public, max-age=86400" ); // 1 day
        break;
      case "taxon_places":
        res.setHeader( "Cache-Control", "public, max-age=30" ); // 30 seconds
        break;
      default:
        res.setHeader( "Cache-Control", "public, max-age=3600" ); // 1 hour
    }
  }
  callback( null, req, res );
};

InaturalistMapserver.placesRoute = function( req, res ) {
  req.params.style = "places";
  req.params.dataType = "postgis";
  ElasticMapper.route( req, res );
};

InaturalistMapserver.taxonPlacesRoute = function( req, res ) {
  req.params.style = "taxon_places";
  req.params.dataType = "postgis";
  ElasticMapper.route( req, res );
};

InaturalistMapserver.taxonRangesRoute = function( req, res ) {
  req.params.style = "taxon_ranges";
  req.params.dataType = "postgis";
  ElasticMapper.route( req, res );
};

module.exports = InaturalistMapserver;
