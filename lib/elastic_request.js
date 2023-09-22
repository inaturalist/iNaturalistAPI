const _ = require( "lodash" );
const Cacheman = require( "recacheman" );
const crypto = require( "crypto" );
const RedisCacheClient = require( "./redis_cache_client" );
const MapGenerator = require( "./map_generator" );
const esClient = require( "./es_client" );

const cache = new Cacheman( );

const RESERVED_COUNT_TIMEOUT = 10000; // 10s
const RESERVED_COUNT_CHECK_DELAY = 100; // 100ms
const COUNT_CACHE_SECONDS = 60 * 60 * 24; // 1 day

const ElasticRequest = { };

ElasticRequest.count = async function ( req ) {
  const query = { ...req.elastic_query };
  delete query.aggregations;
  query.size = 0;
  query.track_total_hits = true;
  const queryHash = crypto
    .createHash( "md5" )
    .update( JSON.stringify( query ), "utf8" )
    .digest( "hex" );
  const cacheKey = `elasticmaps-${queryHash}`;

  const countMethod = async ( ) => {
    const response = await esClient.search( "observations", {
      body: query
    } );
    return response.hits.total.value;
  };

  if ( RedisCacheClient && RedisCacheClient.redisClient ) {
    return ElasticRequest.reservedCount( req, cacheKey, countMethod );
  }

  const cachedCount = await cache.get( cacheKey );
  if ( cachedCount ) {
    return cachedCount;
  }
  const response = await countMethod( );
  await cache.set( cacheKey, response, COUNT_CACHE_SECONDS );
  return response;
};

ElasticRequest.reservedCount = async function (
  req, cacheKey, countMethod, checkReservations = true
) {
  const reservationCacheKey = `${cacheKey}:reservation`;
  const cacheCountMethod = async ( ) => {
    // mark the count as reserved
    await RedisCacheClient.set( reservationCacheKey, "reserved", RESERVED_COUNT_TIMEOUT / 1000 );
    // run the count query
    const countResult = await countMethod( );
    // cache the count
    await RedisCacheClient.set( cacheKey, countResult, COUNT_CACHE_SECONDS );
    // delete the count reservation
    await RedisCacheClient.del( reservationCacheKey );
    return countResult;
  };

  if ( checkReservations ) {
    const retryCountMethod = async ( ) => (
      ElasticRequest.reservedCount( req, cacheKey, countMethod, false )
    );
    // check to see if the count query is reserved (being run) by another process
    return ElasticRequest.waitForReservedCount(
      req, reservationCacheKey, cacheCountMethod, retryCountMethod
    );
  }

  // check if the count is cached
  const cachedCount = await RedisCacheClient.get( cacheKey );
  if ( cachedCount ) {
    return Number( cachedCount );
  }
  // otherwise perform the count process
  return cacheCountMethod( );
};

ElasticRequest.waitForReservedCount = async function (
  req, reservationCacheKey, countMethod, retryCountMethod, startTime = Date.now( )
) {
  if ( Date.now( ) - startTime >= RESERVED_COUNT_TIMEOUT ) {
    // reservation is too old, so run the count
    return retryCountMethod( );
  }
  const reservationExists = await RedisCacheClient.get( reservationCacheKey );
  if ( reservationExists ) {
    // there is a reservation for the count, so wait a bit and check again
    return ElasticRequest.waitForReservedCountDelay(
      req, reservationCacheKey, countMethod, retryCountMethod, startTime
    );
  }
  // there is no reservation, so run the count
  return retryCountMethod( );
};

ElasticRequest.waitForReservedCountDelay = function (
  req, reservationCacheKey, countMethod, retryCountMethod, startTime
) {
  return new Promise( ( resolve, reject ) => {
    // wait RESERVED_COUNT_CHECK_DELAY ms to check again for a reservation
    setTimeout( ( ) => {
      ElasticRequest.waitForReservedCount(
        req, reservationCacheKey, countMethod, retryCountMethod, startTime
      ).then( resolve ).catch( reject );
    }, RESERVED_COUNT_CHECK_DELAY );
  } );
};

ElasticRequest.expandBoxForSmoothEdges = ( req, bbox ) => {
  const qbbox = bbox;
  const height = Math.abs( qbbox[2] - qbbox[0] );
  const width = Math.abs( qbbox[3] - qbbox[1] );
  const factor = ( req && req.params && req.params.style === "grid" ) ? 0.02 : 0.07;
  qbbox[0] -= ( height * factor );
  qbbox[2] += ( height * factor );
  qbbox[1] -= ( width * factor );
  qbbox[3] += ( width * factor );
  if ( qbbox[0] < -180 ) { qbbox[0] = -180; }
  if ( qbbox[1] < -90 ) { qbbox[1] = -90; }
  if ( qbbox[2] > 180 ) { qbbox[2] = 180; }
  if ( qbbox[3] > 90 ) { qbbox[3] = 90; }
  return qbbox;
};

ElasticRequest.boundingBoxFilter = ( req, bbox, smoothing ) => {
  let qbbox = bbox;
  if ( smoothing !== false ) {
    qbbox = ElasticRequest.expandBoxForSmoothEdges( req, qbbox );
  }
  if ( qbbox[2] < qbbox[0] ) {
    // the envelope crosses the dateline. Unfortunately, elasticsearch
    // doesn't handle this well and we need to split the envelope at
    // the dateline and do an OR query
    const left = _.clone( qbbox );
    const right = _.clone( qbbox );
    left[2] = 180;
    right[0] = -180;
    return {
      bool: {
        should: [
          ElasticRequest.boundingBoxFilter( req, left, false ),
          ElasticRequest.boundingBoxFilter( req, right, false )
        ]
      }
    };
  }

  const boundingBox = { };
  boundingBox.location = {
    bottom_left: [qbbox[0], qbbox[1]],
    top_right: [qbbox[2], qbbox[3]]
  };
  return { geo_bounding_box: boundingBox };
};

ElasticRequest.geohashPrecision = ( zoom, offset ) => {
  let precision = 3;
  if ( zoom >= 3 ) { precision = 4; }
  if ( zoom >= 6 ) { precision = 5; }
  if ( zoom >= 8 ) { precision = 6; }
  if ( zoom >= 11 ) { precision = 7; }
  if ( zoom >= 12 ) { precision = 8; }
  if ( zoom >= 13 ) { precision = 9; }
  if ( zoom >= 15 ) { precision = 10; }
  if ( zoom >= 16 ) { precision = 12; }
  if ( offset && offset > 0 && ( precision - offset ) > 0 ) {
    precision -= offset;
  }
  return precision;
};

ElasticRequest.geotileGridPrecision = ( zoom, offset ) => {
  let precision = zoom + 5;
  if ( offset && ( precision - offset ) > 0 ) {
    precision -= offset;
  }
  return precision;
};

ElasticRequest.applyBoundingBoxFilter = req => {
  if ( req.params.dataType === "postgis" ) {
    return;
  }
  MapGenerator.createMercator( );
  req.bbox = MapGenerator.merc.convert( MapGenerator.bboxFromParams( req ) );
  const smoothing = req.params.format !== "torque.json";
  const bboxFilter = ElasticRequest.boundingBoxFilter( req, req.bbox, smoothing );
  if ( !req.elastic_query ) { req.elastic_query = { }; }
  if ( !req.elastic_query.query ) { req.elastic_query.query = { }; }
  if ( !req.elastic_query.query.bool ) { req.elastic_query.query.bool = { }; }
  if ( !req.elastic_query.query.bool.filter ) { req.elastic_query.query.bool.filter = []; }
  req.elastic_query.query.bool.filter.push( bboxFilter );
};

ElasticRequest.geohashAggregation = req => {
  let agg;
  if ( req.geotile || req.geotilegrid ) {
    // use the geotile aggregation added in Elasticsearch 7
    agg = {
      zoom1: {
        geotile_grid: {
          field: "location",
          size: 10000,
          precision: ElasticRequest.geotileGridPrecision(
            req.params.zoom, req.query ? Number( req.query.precision_offset ) : null
          )
        }
      }
    };
  } else {
    agg = {
      zoom1: {
        geohash_grid: {
          field: "location",
          size: 30000,
          precision: ElasticRequest.geohashPrecision(
            req.params.zoom, req.query ? Number( req.query.precision_offset ) : null
          )
        }
      }
    };
  }
  // UTFGrids always need topHits to get metadata for each cell.
  // PNG versions of grid-based styles do not need topHits
  if ( req.params.format === "grid.json" || ( !req.skipTopHits && !req.geogrid && !req.geotilegrid ) ) {
    agg.zoom1.aggs = {
      geohash: {
        top_hits: {
          sort: { id: { order: "desc" } },
          _source: ( ( req.query && req.query.source )
            ? req.query.source : false ),
          size: 1
        }
      }
    };
  }
  return agg;
};

ElasticRequest.torqueAggregation = req => {
  const interval = req.query.interval === "weekly" ? "week" : "month";
  return {
    zoom1: {
      geohash_grid: {
        field: "location",
        size: 30000,
        precision: ElasticRequest.geohashPrecision(
          req.params.zoom, req.query ? Number( req.query.precision_offset ) : null
        )
      },
      aggs: {
        histogram: {
          terms: {
            field: `observed_on_details.${interval}`,
            size: 100
          },
          aggs: {
            geohash: {
              top_hits: {
                sort: { id: { order: "desc" } },
                _source: ( ( req.query && req.query.source )
                  ? req.query.source : false ),
                size: 1
              }
            }
          }
        }
      }
    }
  };
};

module.exports = ElasticRequest;
