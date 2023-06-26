const querystring = require( "querystring" );
const _ = require( "lodash" );
const Geohash = require( "latlon-geohash" );
const MapGenerator = require( "./map_generator" );
const ElasticRequest = require( "./elastic_request" );
const util = require( "./util" );
const esClient = require( "./es_client" );

const ElasticMapper = { };

ElasticMapper.renderMessage = ( res, message, status ) => {
  res.set( "Content-Type", "text/html" );
  res.status( status ).send( message ).end( );
};

ElasticMapper.renderError = ( res, error ) => {
  util.debug( error );
  if ( error.message && error.status ) {
    ElasticMapper.renderMessage( res, error.message, error.status );
  } else {
    ElasticMapper.renderMessage( res, "Error", 500 );
  }
};

ElasticMapper.renderResult = ( req, res, data ) => {
  if ( req.params.format === "grid.json" ) {
    res.jsonp( data );
  } else {
    res.writeHead( 200, { "Content-Type": "image/png" } );
    res.end( data );
  }
};

ElasticMapper.geotileGridGeojson = hit => {
  const parts = hit.key.split( "/" );
  MapGenerator.createMercator( );
  const bbox = MapGenerator.merc.bbox( parts[1], parts[2], parts[0] );
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [bbox[0], bbox[1]],
        [bbox[2], bbox[1]],
        [bbox[2], bbox[3]],
        [bbox[0], bbox[3]],
        [bbox[0], bbox[1]]
      ]]
    },
    properties: {
      cellCount: hit.doc_count
    }
  };
};

ElasticMapper.geohashGridGeojson = hit => {
  const bbox = Geohash.bounds( hit.key );
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [bbox.sw.lon, bbox.sw.lat],
        [bbox.sw.lon, bbox.ne.lat],
        [bbox.ne.lon, bbox.ne.lat],
        [bbox.ne.lon, bbox.sw.lat],
        [bbox.sw.lon, bbox.sw.lat]
      ]]
    },
    properties: {
      cellCount: hit.doc_count
    }
  };
};

ElasticMapper.csvFromResult = ( req, result ) => {
  if ( req.params.dataType === "geojson" ) {
    return ElasticMapper.polygonCSVFromResult( req, result );
  }
  let target;
  if ( result.aggregations && result.aggregations.zoom1 ) {
    target = _.sortBy( result.aggregations.zoom1.buckets, hit => (
      hit.geohash ? hit.geohash.hits.hits[0].sort[0] : null
    ) );
  } else if ( result.hits ) {
    target = result.hits.hits;
  } else { return []; }
  const fieldsToMap = ( req.query.source && req.query.source.includes )
    ? _.without( req.query.source.includes, "location" )
    : [];
  fieldsToMap.push( "cellCount" );
  const csvData = _.map( target, hit => {
    // grids get rendered as polygons
    if ( req.geotilegrid && req.params.format !== "grid.json" ) {
      return ElasticMapper.geotileGridGeojson( hit );
    }
    if ( req.geogrid ) {
      return ElasticMapper.geohashGridGeojson( hit );
    }
    const fieldData = hit._source || hit.geohash.hits.hits[0]._source;
    fieldData.private_location = !_.isEmpty( fieldData.private_location );
    if ( !hit._source && hit.geohash ) {
      fieldData.cellCount = hit.geohash.hits.total.value;
    }
    const properties = { };
    let value;
    _.each( fieldsToMap, f => {
      if ( f.match( /\./ ) ) {
        const parts = f.split( "." );
        if ( fieldData[parts[0]] && fieldData[parts[0]][parts[1]] ) {
          value = fieldData[parts[0]][parts[1]];
        } else {
          value = null;
        }
      } else {
        value = fieldData[f] ? fieldData[f] : null;
      }
      if ( value === "F" ) { value = false; }
      if ( value === "T" ) { value = true; }
      properties[f] = value;
    } );
    let latitude;
    let longitude;
    if ( req.geotilegrid ) {
      const parts = hit.key.split( "/" );
      MapGenerator.createMercator( );
      const bbox = MapGenerator.merc.bbox( parts[1], parts[2], parts[0] );
      latitude = _.mean( [bbox[1], bbox[3]] );
      longitude = _.mean( [bbox[0], bbox[2]] );
    } else if ( _.isObject( fieldData.location ) ) {
      latitude = fieldData.location.lat;
      longitude = fieldData.location.lon;
    } else {
      const coords = fieldData.location.split( "," );
      latitude = Number( coords[0] );
      longitude = Number( coords[1] );
    }
    if ( req.params.format === "grid.json" ) {
      properties.latitude = latitude;
      properties.longitude = longitude;
    }
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      properties
    };
  } );
  return csvData;
};

ElasticMapper.polygonCSVFromResult = ( req, result ) => (
  _.map( result.hits.hits, hit => (
    { id: hit._source.id, geojson: hit._source.geometry_geojson }
  ) )
);

ElasticMapper.printRequestLog = req => {
  let logText = `[ ${new Date( ).toString( )}] GET /${req.params.style}`
    + `/${req.params.zoom}/${req.params.x}`
    + `/${req.params.y}.${req.params.format}`;
  if ( !_.isEmpty( req.query ) ) {
    logText += `?${querystring.stringify( req.query )}`;
  }
  logText += ` ${req.endTime - req.startTime}ms`;
  util.debug( logText );
};

module.exports = ElasticMapper;
