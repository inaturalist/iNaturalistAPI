const fsPromises = require( "fs" ).promises;
const path = require( "path" );
const requestPromise = require( "request-promise" );
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
    const response = await requestPromise( {
      url,
      timeout: 10000,
      encoding: "binary",
      resolveWithFullResponse: true
    } );
    if ( response.statusCode !== 200 ) {
      throw new Error( "download failed" );
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
