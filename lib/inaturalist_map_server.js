const _ = require( "lodash" );
const ElasticMapper = require( "elasticmaps" );
const squel = require( "safe-squel" );
const MapStyles = require( "./inaturalist_map_styles" );
const esClient = require( "./es_client" );
const util = require( "./util" );
const InaturalistAPI = require( "./inaturalist_api" );
const Taxon = require( "./models/taxon" );
const ObservationsController = require( "./controllers/v1/observations_controller" );
const RedisCacheClient = require( "./redis_cache_client" );

const InaturalistMapserver = { };

InaturalistMapserver.taxonPlacesQuery = req => {
  let adminLevel = 0;
  // admin_level corresponds to specificity of location. As the user zooms in,
  // we want more specific locations (e.g. Country -> State -> County...)
  if ( req.params.zoom >= 11 ) {
    adminLevel = 30;
  } else if ( req.params.zoom >= 6 ) {
    adminLevel = 20;
  } else if ( req.params.zoom >= 4 ) {
    adminLevel = 10;
  }

  const query = squel.select( )
    .field( "geom" )
    .field( "MAX(listed_taxa.last_observation_id) as last_observation_id" )
    .field( "MAX(listed_taxa.occurrence_status_level) as occurrence_status_level" )
    .field( "MAX(listed_taxa.establishment_means) as establishment_means" )
    .from( "place_geometries" )
    .join( "places", null, "places.id = place_geometries.place_id" )
    .join( "listed_taxa", null, "listed_taxa.place_id = places.id" )
    .where( "listed_taxa.taxon_id IN ?", util.paramArray( req.params.taxon_id ) || ["null"] )
    .where( "places.admin_level = ?", adminLevel )
    .group( "geom" );
  return `(${query.toString( )} ) AS places`;
};

InaturalistMapserver.taxonRangesQuery = req => {
  const query = squel.select( )
    .field( "geom" )
    .from( "taxon_ranges" )
    .where( "taxon_id IN ?", util.paramArray( req.params.taxon_id ) );
  return `(${query.toString( )} ) AS places`;
};

InaturalistMapserver.placesQuery = req => {
  const query = squel.select( )
    .field( "geom" )
    .from( "place_geometries" )
    .where( "place_id IN ?", util.paramArray( req.params.place_id ) );
  return `(${query.toString( )} ) AS places`;
};

InaturalistMapserver.prepareQuery = ( req, callback ) => {
  req.elastic_query = { };
  if ( req.params.dataType === "postgis" ) {
    if ( req.query.tile_size === "512" ) {
      req.largeTiles = true;
    }
    req.postgis = { };
    if ( req.params.style === "taxon_places" ) {
      req.postgis.query = InaturalistMapserver.taxonPlacesQuery( req );
    } else if ( req.params.style === "taxon_ranges" ) {
      req.postgis.query = InaturalistMapserver.taxonRangesQuery( req );
    } else if ( req.params.style === "places" ) {
      req.postgis.query = InaturalistMapserver.placesQuery( req );
    } else {
      return void callback( {
        error: `unknown style: ${req.params.style}`,
        status: 404
      }, req );
    }
    return void callback( null, req );
  }
  req.query.order_by = "id";
  req.query.source = { includes: InaturalistAPI.defaultMapFields( ) };
  // requiring mappable=true to be included in map tiles
  req.query.mappable = "true";
  ObservationsController.reqToElasticQuery( req ).then( query => {
    const elasticQuery = query;
    const searchHash = esClient.searchHash( elasticQuery );
    req.elastic_query.query = searchHash.query;
    if ( req.query.tile_size === "512" ) {
      req.largeTiles = true;
    }
    if ( _.includes( ["summary", "grid", "heatmap"], req.params.style ) ) {
      req.geotilegrid = true;
    } else if ( req.params.style === "points" && req.query.style === "geotilegrid" ) {
      req.geotile = true;
    } else {
      if ( req.query.skip_top_hits ) {
        req.skipTopHits = true;
      }
      if ( req.query.style === "geogrid" ) {
        req.geogrid = true;
      } else if ( req.query.style === "geotile" ) {
        req.geotile = true;
      } else if ( req.query.style === "geotilegrid" ) {
        req.geotilegrid = true;
      }
    }
    if ( _.includes( ["summary", "grid"], req.params.style ) || (
      req.params.style === "colored_heatmap" && ( req.geotilegrid || req.geogrid )
    ) ) {
      req.includeTotalHits = true;
    }

    switch ( req.params.style ) {
      case "heatmap":
      case "grid":
      case "colored_heatmap":
      case "summary":
      case "points":
        req.elastic_query.size = 0;
        if ( req.params.format === "torque.json" ) {
          req.elastic_query.aggregations = ElasticMapper.torqueAggregation( req );
        } else {
          req.tileCache = true;
          // configured to use redis, and extended with async method variants
          if ( RedisCacheClient && RedisCacheClient.get ) {
            req.redisCacheClient = RedisCacheClient;
          }
          req.elastic_query.aggregations = ElasticMapper.geohashAggregation( req );
        }
        break;
      default:
        return void callback( {
          error: `unknown style: ${req.params.style}`,
          status: 404
        }, req );
    }
    callback( null, req );
  } ).catch( callback );
};

InaturalistMapserver.prepareStyle = ( req, callback ) => {
  req.inat = req.inat || { };
  let color;
  const tileOptions = {
    zoom: req.params.zoom,
    totalHits: req.totalHits
  };
  switch ( req.params.style ) {
    case "heatmap":
      req.style = MapStyles.geotilegridHeatmap( req.query.color, tileOptions );
      break;
    case "summary":
      req.style = MapStyles.geotilegrid( "#6e6e6e", tileOptions );
      break;
    case "grid":
      req.style = MapStyles.geotilegrid( req.query.color, tileOptions );
      break;
    case "colored_heatmap":
      Object.assign( tileOptions, req.params, req.query );
      if ( req.inat.taxon && !req.query.color ) {
        tileOptions.color = Taxon.iconicTaxonColor( req.inat.taxon.iconic_taxon_id );
      }
      if ( req.geotilegrid || req.geogrid ) {
        req.style = MapStyles.geotilegrid( req.query.color, tileOptions );
      } else {
        req.style = MapStyles.coloredHeatmap( tileOptions );
      }
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
      if ( req.query.color ) {
        color = req.query.color; // eslint-disable-line prefer-destructuring
      } else if ( req.inat.taxon ) {
        color = Taxon.iconicTaxonColor( req.inat.taxon.iconic_taxon_id );
      }
      req.style = color
        ? MapStyles.markersAndCircles( color )
        : MapStyles.markersAndCircles( );
  }
  callback( null, req );
};

InaturalistMapserver.beforeSendResult = ( req, res, callback ) => {
  if ( req.query.ttl && Number( req.query.ttl ) ) {
    res.setHeader( "Cache-Control", `public, max-age=${Number( req.query.ttl )}` );
  } else {
    switch ( req.params.style ) {
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

InaturalistMapserver.placesRoute = ( req, res ) => {
  req.params.style = "places";
  req.params.dataType = "postgis";
  ElasticMapper.route( req, res );
};

InaturalistMapserver.taxonPlacesRoute = ( req, res ) => {
  req.params.style = "taxon_places";
  req.params.dataType = "postgis";
  ElasticMapper.route( req, res );
};

InaturalistMapserver.taxonRangesRoute = ( req, res ) => {
  req.params.style = "taxon_ranges";
  req.params.dataType = "postgis";
  ElasticMapper.route( req, res );
};

module.exports = InaturalistMapserver;
