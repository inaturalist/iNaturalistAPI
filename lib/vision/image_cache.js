const fsPromises = require( "fs" ).promises;
const path = require( "path" );
const fetch = require( "node-fetch" );
const crypto = require( "crypto" );

const ImageCache = class ImageCache {
  static async cacheURL( url, filename ) {
    const urlHash = ImageCache.checksum( url );
    const dir = path.resolve( __dirname, "cache", urlHash.substr( 0, 2 ) );
    const cachePath = path.resolve( dir, filename );
    try {
      await fsPromises.mkdir( dir );
    } catch ( e ) {
      if ( e.code !== "EEXIST" ) {
        throw e;
      }
    }
    try {
      await fsPromises.access( cachePath );
      return cachePath;
    } catch ( e ) {
      if ( e.code !== "ENOENT" ) {
        // the file exists, so return the cache path
        throw e;
      }
    }
    return ImageCache.downloadFile( url, cachePath );
  }

  static async downloadFile( url, cachePath ) {
    console.log( `Attempting to download ${url}` ); // eslint-disable-line no-console
    const imageRequestAbortController = new AbortController( );
    const imageRequestTimeout = setTimeout( ( ) => {
      imageRequestAbortController.abort( );
    }, 10000 );
    let response;
    try {
      response = await fetch( url, {
        signal: imageRequestAbortController.signal
      } );
      if ( !response.ok ) {
        throw new Error( "download failed" );
      }
    } catch ( error ) {
      throw new Error( "download failed" );
    } finally {
      clearTimeout( imageRequestTimeout );
    }
    await fsPromises.writeFile( cachePath, response.body, "binary" );
    return cachePath;
  }

  static checksum( str, algorithm, encoding ) {
    return crypto
      .createHash( algorithm || "md5" )
      .update( str, "utf8" )
      .digest( encoding || "hex" );
  }
};

module.exports = ImageCache;
