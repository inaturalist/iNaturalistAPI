const _ = require( "lodash" );
const fs = require( "fs" );
// const path = require( "path" );
const Cacheman = require( "cacheman" );
const CachemanFile = require( "cacheman-file" );
const config = require( "../config" );

const CachemanCache = {
  memoryCache: new Cacheman( )
};

// enable fileCache if configured and cachDir exists
if ( config.cacheDir && fs.existsSync( config.cacheDir ) ) {
  CachemanCache.fileCache = new CachemanFile( { tmpDir: config.cacheDir } );
}

// fetch `cacheKey` from cache `cacheType`. If there's an error or the key exists,
// run callback( err, cachedValue ), otherwise run method onMissingCallback
CachemanCache.cachedOrFetch = ( cacheType, cacheKey, onMissingCallback, callback ) => {
  if ( _.isEmpty( cacheKey ) || ( cacheType !== "memory" && cacheType !== "file" ) ) {
    return void onMissingCallback( );
  }
  if ( cacheType === "file" && !CachemanCache.fileCache ) {
    return void onMissingCallback( );
  }
  const cache = ( cacheType === "file" ) ? CachemanCache.fileCache : CachemanCache.memoryCache;
  cache.get( cacheKey, ( err, value ) => {
    if ( err ) { return void callback( err ); }
    if ( value ) {
      return void callback( null, value );
    }
    onMissingCallback( );
  } );
};

CachemanCache.cachedOrFetchFile = ( cacheKey, onMissingCallback, callback ) => {
  CachemanCache.cachedOrFetch( "file", cacheKey, onMissingCallback, callback );
};

CachemanCache.cachedOrFetchMemory = ( cacheKey, onMissingCallback, callback ) => {
  CachemanCache.cachedOrFetch( "memory", cacheKey, onMissingCallback, callback );
};

// create and return a callback wrapper that expects to be called like
// callbackWrapper( err, data ). It will cache data under `cacheKey` in cache
// `cacheType` for `ttl` seconds and send the data to the original `callback`
CachemanCache.cachedCallback = ( cacheType, cacheKey, ttl, callback ) => {
  if ( _.isEmpty( cacheKey ) || ( cacheType !== "memory" && cacheType !== "file" ) ) {
    return callback;
  }
  if ( cacheType === "file" && !CachemanCache.fileCache ) {
    return callback;
  }
  const cache = ( cacheType === "file" ) ? CachemanCache.fileCache : CachemanCache.memoryCache;
  return ( err, data ) => {
    if ( err ) {
      return void callback( err );
    }
    cache.set( cacheKey, data, ttl, ( ) => {
      callback( null, data );
    } );
  };
};

CachemanCache.cachedCallbackFile = ( cacheKey, ttl, callback ) => (
  CachemanCache.cachedCallback( "file", cacheKey, ttl, callback )
);

CachemanCache.cachedCallbackMemory = ( cacheKey, ttl, callback ) => (
  CachemanCache.cachedCallback( "memory", cacheKey, ttl, callback )
);


module.exports = CachemanCache;
