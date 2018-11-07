const fs = require( "fs" );
const path = require( "path" );
const request = require( "request" );
const crypto = require( "crypto" );

const ImageCache = class ImageCache {
  static cacheURL( url, filename, callback ) {
    const urlHash = ImageCache.checksum( url );
    const dir = path.resolve( __dirname, "cache", urlHash.substr( 0, 2 ) );
    const cachePath = path.resolve( dir, filename );
    fs.mkdir( dir, ( ) => {
      fs.exists( cachePath, exists => {
        if ( exists === true ) {
          return void callback( null, cachePath );
        }
        ImageCache.downloadFile( url, cachePath, callback );
      } );
    } );
  }

  static downloadFile( url, cachePath, callback ) {
    console.log( `Attempting to download ${url}` ); // eslint-disable-line no-console
    request( { url, timeout: 10000, encoding: "binary" }, ( error, response, body ) => {
      if ( error || response.statusCode !== 200 ) {
        return void callback( error || { error: "download failed" } );
      }
      fs.writeFile( cachePath, body, "binary", err => {
        if ( err ) { return void callback( err ); }
        callback( null, cachePath );
      } );
    } );
  }

  static checksum( str, algorithm, encoding ) {
    return crypto
      .createHash( algorithm || "md5" )
      .update( str, "utf8" )
      .digest( encoding || "hex" );
  }
};

module.exports = ImageCache;
