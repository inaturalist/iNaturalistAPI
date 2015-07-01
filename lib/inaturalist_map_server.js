var ElasticMapper = require( "elasticmaps" ),
    MapStyles = require( "./inaturalist_map_styles" ),
    esClient = require( "./es_client" ),
    util = require( "./util" ),
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
  // requiring mappable=true to be included in map tiles
  req.query.mappable = "true";
  var elastic_query = InaturalistAPI.paramsToElasticQuery( req.query );
  var searchHash = esClient.searchHash( elastic_query );
  req.elastic_query.query = searchHash.query;
  if( req.params.zoom >= 8 ) {
    if( req.elastic_query.query.filtered ) {
      if( req.elastic_query.query.filtered.filter.bool ) {
        req.elastic_query.query.filtered.filter.bool.must.push(
          { not: { exists: { field: "private_location" } } });
      } else {
        console.log( "this query has a problem with zooms over 8:" );
        console.log( JSON.stringify( req.elastic_query.query.filtered, null, "  " ) );
      }
    } else {
      req.elastic_query.query = {
        filtered: {
          query: req.elastic_query.query,
          filter: { bool: { must: [ { not: { exists: { field: "private_location" } } } ] } }
        }
      };
    }
  }

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
      req.style = MapStyles.coloredHeatmap( "#6E6E6E", 8 );
      break;
    case "colored_heatmap":
      var color;
      if( req.query.color ) {
        color = req.query.color;
      } else if( req.taxon ) {
        color = util.iconicTaxonColors[ req.taxon.iconic_taxon_id ];
      }
      req.style = MapStyles.coloredHeatmap( color );
      break;
    default:
      var color
      if( req.query.color ) {
        color = req.query.color;
      } else if( req.taxon ) {
        color = util.iconicTaxonColors[ req.taxon.iconic_taxon_id ];
      }
      if( color ) { req.style = MapStyles.coloredPoints( color ); }
      else { req.style = MapStyles.points( ); }
  }
  callback( null, req );
};

InaturalistMapserver.beforeSendResult = function( req, res, callback ) {
  if( req.params.style === "summary" ) {
    // summaries are cached for a day
    res.setHeader( "Cache-Control", "public, max-age=86400" );
  } else {
    // everything else is cached for an hour
    res.setHeader( "Cache-Control", "public, max-age=3600" );
  }
  callback( null, req, res );
};

module.exports = InaturalistMapserver;
