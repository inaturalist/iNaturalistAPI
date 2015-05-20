var ElasticMapper = require( "elasticmaps" ),
    MapStyles = require( "./inaturalist_map_styles" ),
    InaturalistAPI = require( "./inaturalist_api" );

var InaturalistMapserver = { };

InaturalistMapserver.prepareQuery = function( req, callback ) {
  req.elastic_query = { };
  req.elastic_query["sort"] = { "id" : "desc" };
  req.elastic_query["fields"] = InaturalistAPI.defaultMapFields( );
  req.elastic_query["query"] = InaturalistAPI.defaultMapFilters( );
  InaturalistAPI.filterRequest( req.elastic_query, req.query );
  switch( req.params.style ) {
    case "heatmap":
    case "geohash":
      req.elastic_query["size"] = 0;
      req.elastic_query["aggregations"] = ElasticMapper.geohashAggregation( req );
      break;
    case "points":
      req.elastic_query["size"] = 20000;
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
      req.style = MapStyles.heatmap( );
      break;
    default:
      req.style = MapStyles.points( );
  }
  callback( null, req );
};

module.exports = InaturalistMapserver;
