const _ = require( "lodash" );
const squel = require( "safe-squel" );
const chroma = require( "chroma-js" );
const MapStyles = require( "./inaturalist_map_styles" );
const esClient = require( "./es_client" );
const util = require( "./util" );
const Taxon = require( "./models/taxon" );
const ObservationsController = require( "./controllers/v1/observations_controller" );
const MapGenerator = require( "./map_generator" );
const ElasticMapper = require( "./elastic_mapper" );
const ElasticRequest = require( "./elastic_request" );

const InaturalistMapserver = { };

const customColorScale = ( lowColor, highColor, min, max ) => {
  const baseScale = chroma.scale( [
    chroma( lowColor ).alpha( 0 ),
    chroma( lowColor ).alpha( 1 ),
    chroma( highColor ).alpha( 1 )
  ] ).domain( [min, max] );
  return chroma.scale( [baseScale( min ), baseScale( max )] );
};

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

InaturalistMapserver.prepareQuery = async req => {
  req.elastic_query = { };
  if ( req.params.dataType === "postgis" || req.params.dataType === "geomodel" ) {
    req.largeTiles = ( Number( req.query.tile_size ) === 512 );
  } else {
    req.query.order_by = "id";
    req.query.source = { includes: ElasticMapper.DEFAULT_OBSERVATION_MAP_FIELDS };
    // requiring mappable=true to be included in map tiles
    req.query.mappable = "true";
    const query = await ObservationsController.reqToElasticQuery( req );
    const elasticQuery = query;
    const searchHash = esClient.searchHash( elasticQuery );
    req.elastic_query.query = searchHash.query;
    if ( Number( req.query.tile_size ) === 512 ) {
      req.largeTiles = true;
    }
    if ( _.includes( ["summary", "grid", "heatmap"], req.params.style ) ) {
      req.geotilegrid = true;
    } else if ( req.params.style === "points" && req.query.style === "geotilegrid" ) {
      req.geotile = true;
    }
    if ( _.includes( ["summary", "grid"], req.params.style ) || (
      req.params.style === "colored_heatmap" && ( req.geotilegrid || req.geogrid )
    ) ) {
      req.includeTotalHits = true;
    }
  }

  switch ( req.params.style ) {
    case "places":
    case "taxon_places":
    case "taxon_ranges":
    case "geomodel_style":
      break;
    case "heatmap":
    case "grid":
    case "colored_heatmap":
    case "summary":
    case "points":
      req.elastic_query.size = 0;
      if ( req.params.format === "torque.json" ) {
        req.elastic_query.aggregations = ElasticRequest.torqueAggregation( req );
      } else {
        req.tileCache = true;
        req.elastic_query.aggregations = ElasticRequest.geohashAggregation( req );
      }
      break;
    default:
      // eslint-disable-next-line no-case-declarations
      const e = new Error( );
      e.status = 404;
      e.message = `unknown style: ${req.params.style}`;
      throw e;
  }
};

InaturalistMapserver.prepareStyle = async req => {
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
    case "geomodel_style":
      req.style = MapStyles.geomodelStyle( );
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
};

InaturalistMapserver.setCacheHeaders = async ( req, res ) => {
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
};

InaturalistMapserver.placesRoute = async ( req, res ) => {
  req.params.style = "places";
  req.params.dataType = "postgis";
  req.postgis = {
    query: InaturalistMapserver.placesQuery( req )
  };
  await InaturalistMapserver.defaultRoute( req, res );
};

InaturalistMapserver.taxonPlacesRoute = async ( req, res ) => {
  req.params.style = "taxon_places";
  req.params.dataType = "postgis";
  req.postgis = {
    query: InaturalistMapserver.taxonPlacesQuery( req )
  };
  await InaturalistMapserver.defaultRoute( req, res );
};

InaturalistMapserver.geomodelRoute = async ( req, res ) => {
  req.params.style = "geomodel_style";
  req.params.dataType = "geomodel";
  await InaturalistMapserver.defaultRoute( req, res );
};

InaturalistMapserver.geomodelTaxonRangeRoute = async ( req, res ) => {
  req.params.style = "geomodel_style";
  req.params.dataType = "geomodel_taxon_range";
  await InaturalistMapserver.defaultRoute( req, res );
};

InaturalistMapserver.geomodelComparisonRoute = async ( req, res ) => {
  req.params.style = "geomodel_style";
  req.params.dataType = "geomodel_comparison";
  await InaturalistMapserver.defaultRoute( req, res );
};

InaturalistMapserver.taxonRangesRoute = async ( req, res ) => {
  req.params.style = "taxon_ranges";
  req.params.dataType = "postgis";
  req.postgis = {
    query: InaturalistMapserver.taxonRangesQuery( req )
  };
  await InaturalistMapserver.defaultRoute( req, res );
};

InaturalistMapserver.defaultRoute = async ( req, res ) => {
  req.startTime = Date.now( );
  req.params.zoom = parseInt( req.params.zoom, 10 );
  req.params.x = parseInt( req.params.x, 10 );
  req.params.y = parseInt( req.params.y, 10 );
  if ( req.params.zoom < 0 || req.params.zoom > 21 ) {
    ElasticMapper.renderMessage( res, "Invalid zoom", 404 );
    return;
  }
  const zoomDimension = 2 ** req.params.zoom;
  if ( req.params.x < 0 || req.params.x >= zoomDimension ) {
    ElasticMapper.renderMessage( res, "Invalid x value", 404 );
    return;
  }
  if ( req.params.y < 0 || req.params.y >= zoomDimension ) {
    ElasticMapper.renderMessage( res, "Invalid y value", 404 );
    return;
  }
  if ( !_.includes( ["png", "grid.json", "torque.json"], req.params.format ) ) {
    ElasticMapper.renderMessage( res, "Invalid format", 404 );
    return;
  }

  try {
    await InaturalistMapserver.prepareQuery( req );
    if ( req.params.dataType === "geomodel" ) {
      let colorScale;
      const additionalParameters = { };
      if ( req.query.thresholded === "true" ) {
        colorScale = chroma.scale( [chroma( "#007DFF" ).alpha( 0.4 )] );
        additionalParameters.thresholded = true;
      } else {
        colorScale = customColorScale( "#97CAFF", "#1574D8", 0, 1 );
      }
      req.csvData = await MapGenerator.pythonTilesGeojson(
        req, "h3_04", colorScale, additionalParameters
      );
    } else if ( req.params.dataType === "geomodel_taxon_range" ) {
      const colorScale = chroma.scale( [chroma( "#FF5EB0" ).alpha( 0.4 )] );
      req.csvData = await MapGenerator.pythonTilesGeojson(
        req, "h3_04_taxon_range", colorScale
      );
    } else if ( req.params.dataType === "geomodel_comparison" ) {
      const colorScale = chroma.scale( [
        chroma( "#007DFF" ).alpha( 0.4 ),
        chroma( "#5A57D1" ).alpha( 0.8 ),
        chroma( "#FF5EB0" ).alpha( 0.4 )
      ] );
      req.csvData = await MapGenerator.pythonTilesGeojson( req, "h3_04_taxon_range_comparison", colorScale );
    } else if ( req.params.dataType !== "postgis" ) {
      if ( req.includeTotalHits ) {
        const cachedCount = await ElasticRequest.count( req );
        req.totalHits = cachedCount || 0;
      }
      ElasticRequest.applyBoundingBoxFilter( req );
      const result = await esClient.search( "observations", {
        body: { ...req.elastic_query, track_total_hits: false }
      } );
      if ( req.params.format === "torque.json" ) {
        MapGenerator.torqueJson( result, req, res );
        return;
      }
      util.debug( `${result.took}ms :: [${req.bbox}]` );
      req.csvData = await ElasticMapper.csvFromResult( req, result );
    }
    if ( req.params.format !== "grid.json" ) {
      await InaturalistMapserver.prepareStyle( req );
    }
    const { map, layer } = await MapGenerator.createMapTemplate( req );
    await MapGenerator.finishMap( req, res, map, layer, req.csvData );
    await InaturalistMapserver.setCacheHeaders( req, res );
    req.endTime = new Date( );
    ElasticMapper.renderResult( req, res, req.tileData );
    ElasticMapper.printRequestLog( req );
  } catch ( e ) {
    ElasticMapper.renderError( res, e );
  }
};

module.exports = InaturalistMapserver;
