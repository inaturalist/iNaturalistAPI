const mapnik = require( "mapnik" );
const _ = require( "lodash" );
const fs = require( "fs" );
const path = require( "path" );
const flatten = require( "flat" );
const { promisify } = require( "util" );
const h3 = require( "h3-js" );
const SphericalMercator = require( "@mapbox/sphericalmercator" );
const ESModel = require( "./models/es_model" );
const config = require( "../config" );
const util = require( "./util" );

// register shapefile plugin
if ( mapnik.register_default_input_plugins ) {
  mapnik.register_default_input_plugins( );
}

const proj4 = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 "
            + "+y_0=0.0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over";

const DEFAULT_POINTS_STYLE = `
  <Style name='style' filter-mode='first'>
    <Rule>\
      <MarkersSymbolizer width='8' stroke-width='0.5' multi-policy='whole'
        fill='#D8D8D8' fill-opacity='1' stroke='#000000' stroke-opacity='1.0'
        placement='point' marker-type='ellipse' allow-overlap='true'
        comp-op='src' />
    </Rule>
  </Style>`;

const MapGenerator = { merc: null };

MapGenerator.DEFAULT_OBSERVATION_MAP_FIELDS = [
  "id", "uuid", "location", "taxon.iconic_taxon_id",
  "captive", "quality_grade", "geoprivacy", "private_location"
];

MapGenerator.buildDbName = ( ) => {
  // Throw exception is NODE_ENV is not set
  if ( _.isEmpty( process.env.NODE_ENV ) ) {
    throw new Error( "env.NODE_ENV is not set" );
  }
  return process.env.NODE_ENV === "test" ? "inaturalist_test" : ( process.env.INAT_DB_NAME || `inaturalist_${process.env.NODE_ENV}` );
};

MapGenerator.blankImage = fs.readFileSync( path.join( __dirname, "assets/blank.png" ) );

MapGenerator.createMercator = ( ) => {
  if ( MapGenerator.merc === null ) {
    MapGenerator.merc = new SphericalMercator( { size: config.tileSize } );
  }
};

MapGenerator.bboxFromParams = req => {
  MapGenerator.createMercator( );
  let zoom = parseInt( req.params.zoom, 10 );
  if ( req.largeTiles ) { zoom -= 1; }
  return MapGenerator.merc.bbox(
    parseInt( req.params.x, 10 ),
    parseInt( req.params.y, 10 ),
    zoom,
    false,
    "900913"
  );
};

MapGenerator.createLayer = ( ) => {
  const layer = new mapnik.Layer( "tile", "+init=epsg:4326" );
  layer.styles = ["style"];
  return layer;
};

MapGenerator.postgisDatasource = req => {
  let zoom = parseInt( req.params.zoom, 10 );
  if ( req.largeTiles ) { zoom -= 1; }
  const datasourceConfig = {
    ...config.database,
    ...( config.database.replica || { } ),
    dbname: MapGenerator.buildDbName( ),
    type: "postgis",
    table: req.postgis.query,
    simplify_geometries: true,
    srid: 4326,
    geometry_field: "geom",
    extent: MapGenerator.merc.bbox(
      parseInt( req.params.x, 10 ),
      parseInt( req.params.y, 10 ),
      zoom
    )
  };
  return new mapnik.Datasource( datasourceConfig );
};

MapGenerator.geojsonDatasource = features => {
  if ( _.isEmpty( features ) ) { return null; }
  const datasourceConfig = {
    type: "geojson",
    inline: JSON.stringify( {
      type: "FeatureCollection",
      features
    } )
  };
  return new mapnik.Datasource( datasourceConfig );
};

MapGenerator.finishMap = async ( req, res, map, layer, features ) => {
  if ( features && features.length === 0 && req.params.format !== "grid.json" ) {
    req.tileData = MapGenerator.blankImage;
    return;
  }
  let fields;
  if ( req.params.dataType === "postgis" ) {
    layer.datasource = MapGenerator.postgisDatasource( req );
  } else {
    const memDS = MapGenerator.geojsonDatasource( features );
    if ( memDS ) { layer.datasource = memDS; }
  }
  map.add_layer( layer );
  let tileSize = _.clone( config.tileSize );
  if ( req.largeTiles ) { tileSize *= 2; }
  const mapRender = promisify( map.render.bind( map ) );
  if ( req.params.format === "grid.json" ) {
    fields = _.without( req.query.source.includes, "location" );
    // geohash aggregations will have cellCount
    if ( req.elastic_query.aggregations && req.elastic_query.aggregations.zoom1 ) {
      fields.push( "cellCount" );
    }
    fields = fields.concat( ["latitude", "longitude"] );

    const options = { };
    options.layer = "tile";
    options.fields = fields;
    options.headers = { "Content-Type": "application/json" };
    const im = new mapnik.Grid( tileSize / 2, tileSize / 2, { key: "id" } );
    const img = await mapRender( im, options );
    req.tileData = img.encodeSync( );
    return;
  }
  const im = new mapnik.Image( tileSize, tileSize );
  const img = await mapRender( im, { scale: 2 } );
  req.tileData = img.encodeSync( );
};

MapGenerator.mapXML = specificStyle => (
  `
    <Map srs='${proj4}' buffer-size='64' maximum-extent='-20037508.34,-20037508.34,20037508.34,20037508.34'>
      ${specificStyle}
    </Map>`
);

MapGenerator.createMapTemplate = async req => {
  req.style = req.style || DEFAULT_POINTS_STYLE;
  let tileSize = _.clone( config.tileSize );
  if ( req.largeTiles ) { tileSize *= 2; }
  if ( req.params.format === "grid.json" ) {
    tileSize /= 2;
  }
  const map = new mapnik.Map( tileSize, tileSize, proj4 );
  const bbox = MapGenerator.bboxFromParams( req );
  const layer = MapGenerator.createLayer( );
  const xml = MapGenerator.mapXML( req.style );
  map.extent = bbox;
  const fromString = promisify( map.fromString.bind( map ) );
  const mapFromString = await fromString( xml, { strict: true, base: "./" } );
  return {
    map: mapFromString,
    layer
  };
};

MapGenerator.torqueJson = async ( queryResult, req, res ) => {
  const [minlon, minlat, maxlon, maxlat] = req.bbox;
  const mercMin = MapGenerator.merc.px( [minlon, minlat], req.params.zoom );
  const mercMax = MapGenerator.merc.px( [maxlon, maxlat], req.params.zoom );
  const latdiff = Math.abs( mercMax[1] - mercMin[1] );
  const londiff = Math.abs( mercMax[0] - mercMin[0] );
  const returnArray = [];

  let tileObservationsByID = {};
  const observationIDs = _.compact( _.flatten( _.map(
    queryResult.aggregations.zoom1.buckets, cellBucket => (
      _.map(
        cellBucket.histogram.buckets,
        histogramBucket => histogramBucket?.cellMaxObsID.value
      )
    )
  ) ) );
  if ( !_.isEmpty( observationIDs ) ) {
    // fetch the latest observations for each grid cell
    const geohashObs = await ESModel.mgetResults( observationIDs, "observations", {
      source: util.sourceParams( MapGenerator.DEFAULT_OBSERVATION_MAP_FIELDS )
    } );
    tileObservationsByID = _.keyBy( _.map( geohashObs.hits.hits, "_source" ), "id" );
  }

  const filteredBuckets = _.filter( queryResult.aggregations.zoom1.buckets,
    b => !_.isEmpty( b.histogram.buckets ) );
  _.each( filteredBuckets, b => {
    const vals = [];
    const dates = [];
    let hashInfo;
    _.each( b.histogram.buckets, hb => {
      const doc = tileObservationsByID[hb.cellMaxObsID.value];
      if ( !doc ) {
        return;
      }
      if ( !hashInfo ) {
        hashInfo = doc.location.split( "," );
      }
      vals.push( { value: hb.doc_count, ...flatten( doc ) } );
      dates.push( hb.key - 1 );
    } );
    const mercCoords = MapGenerator.merc.px( [hashInfo[1], hashInfo[0]], req.params.zoom );
    const torqueX = Math.floor( ( Math.abs( mercCoords[0] - mercMin[0] ) / latdiff ) * 255 );
    const torqueY = Math.floor( ( Math.abs( mercCoords[1] - mercMin[1] ) / londiff ) * 255 );
    returnArray.push( {
      x__uint8: torqueX,
      y__uint8: torqueY,
      vals__uint8: vals,
      dates__uint16: dates
    } );
  } );
  res.set( "Content-Type", "text/html" ).status( 200 ).json( returnArray ).end( );
};

MapGenerator.pythonTilesGeojson = async (
  req, pythonTilesEndpoint, colorScale, additionalParams = { }
) => {
  MapGenerator.createMercator( );
  const bbox = MapGenerator.merc.convert( MapGenerator.bboxFromParams( req ) );
  const requestAbortController = new AbortController( );
  const requestTimeout = setTimeout( ( ) => {
    requestAbortController.abort( );
  }, 5000 );
  let json;
  const [swlon, swlat, nelon, nelat] = bbox;
  // fetch the raw h3 cell data, aborting if the timeout is reached
  try {
    const params = {
      taxon_id: req.params.taxon_id,
      swlat,
      swlng: swlon,
      nelat,
      nelng: nelon
    };
    const urlParams = new URLSearchParams( { ...additionalParams, ...params } );
    const tileURL = `${config.imageProcesing.tensorappURL}/${pythonTilesEndpoint}?${urlParams.toString( )}`;
    const response = await fetch( tileURL, {
      signal: requestAbortController.signal
    } );
    if ( !response.ok ) {
      throw util.httpError( 500, "Error" );
    }
    json = await response.json( );
  } catch ( error ) {
    throw util.httpError( 500, "Error" );
  } finally {
    clearTimeout( requestTimeout );
  }
  // modify the raw data as needed to properly render GeoJSON, and return as GeoJSON polygons
  return _.map( json, ( value, h3Index ) => {
    const lng = h3.cellToLatLng( h3Index )[1];
    const geoJSONCoords = h3.cellToBoundary( h3Index, true );
    // some modifications to better render GeoJSON polygons that wrap the antimeridian
    if ( lng > 90 ) {
      _.each( geoJSONCoords, coord => {
        if ( coord[0] < -90 ) {
          coord[0] += 360;
        }
      } );
    } else if ( lng < -90 ) {
      _.each( geoJSONCoords, coord => {
        if ( coord[0] > 90 ) {
          coord[0] -= 360;
        }
      } );
    }
    // TODO: still not working right on antimeridian. See 849b447ffffffff / 849b447ffffffff
    if ( swlon < -175 ) {
      _.each( geoJSONCoords, coord => {
        if ( coord[0] > 175 ) {
          coord[0] -= 360;
        }
      } );
    } else if ( nelon > 175 ) {
      _.each( geoJSONCoords, coord => {
        if ( coord[0] < -175 ) {
          coord[0] += 360;
        }
      } );
    }
    return {
      type: "Feature",
      properties: {
        value,
        color: colorScale( value ).hex()
      },
      geometry: {
        type: "Polygon",
        coordinates: [geoJSONCoords]
      }
    };
  } );
};

module.exports = MapGenerator;
