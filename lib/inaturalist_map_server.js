var ElasticMapper = require( "elasticmaps" ),
    MapStyles = require( "./inaturalist_map_styles" ),
    InaturalistAPI = require( "./inaturalist_api" );

var InaturalistMapserver = { };

InaturalistMapserver.beforePrepareQuery = function( req, callback ) {
  if( req.query.taxon_id ) {
    InaturalistAPI.lookupTaxon( req.query.taxon_id, function( err, taxon ) {
      if( !taxon ) {
        callback( { message: "Unknown taxonID " + req.query.taxon_id, status: 500 } );
      } else {
        req.taxon = taxon;
        callback( null );
      }
    });
  } else {
    callback( null );
  }
};

InaturalistMapserver.prepareQuery = function( req, callback ) {
  req.elastic_query = { };
  req.elastic_query.sort = { id: "desc" };
  req.elastic_query.fields = InaturalistAPI.defaultMapFields( );
  req.elastic_query.query = InaturalistAPI.defaultMapFilters( );
  if( req.params.zoom >= 8 ) {
    req.elastic_query.query.filtered.filter.push(
      { not: { exists: { field: "private_location" } } });
  }
  InaturalistAPI.filterRequest( req.elastic_query, req.query );
  switch( req.params.style ) {
    case "heatmap":
    case "colored_heatmap":
    case "summary":
    case "points":
      req.elastic_query.size = 0;
      req.elastic_query.aggregations = ElasticMapper.geohashAggregation( req );
      break;
    default:
      return callback( { message: "unknown style: " +
        req.params.style, status: 404 }, req );
  }
  callback( null, req );
};

InaturalistMapserver.prepareStyle = function( req, callback ) {
  switch( req.params.style ) {
    case "heatmap":
      req.style = MapStyles.heatmap( req.query.color );
      break;
    case "summary":
      req.style = MapStyles.greySummary( );
      break;
    case "colored_heatmap":
      var color = "#6E6E6E";
      if( req.query.color ) {
        color = req.query.color;
      } else if( req.taxon ) {
        color = iconicTaxonColors[ req.taxon.iconic_taxon_id ];
      }
      req.style = MapStyles.coloredHeatmap( color );
      break;
    default:
      var color
      if( req.query.color ) {
        color = req.query.color;
      } else if( req.taxon ) {
        color = iconicTaxonColors[ req.taxon.iconic_taxon_id ];
      }
      if( color ) { req.style = MapStyles.coloredPoints( color ); }
      else { req.style = MapStyles.points( ); }
  }
  callback( null, req );
};

var iconicTaxonColors = {
  1: "#1E90FF",
  3: "#1E90FF",
  20978: "#1E90FF",
  26036: "#1E90FF",
  40151: "#1E90FF",
  47115: "#FF4500",
  47119: "#FF4500",
  47126: "#73AC13",
  47158: "#FF4500",
  47170: "#FF1493",
  47178: "#1E90FF",
  47686: "#8B008B",
  48222: "#993300"
};

module.exports = InaturalistMapserver;
