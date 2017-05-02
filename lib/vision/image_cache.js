"use strict";
var fs = require( "fs" );
var path = require( "path" );
var request = require( "request" );
var crypto = require( "crypto" );

var ImageCache = class ImageCache {

  static cacheURL( url, filename, callback ) {
    var urlHash = ImageCache.checksum( url );
    var dir = path.resolve( __dirname, "cache", urlHash.substr( 0, 2 ) );
    var cachePath = path.resolve( dir, filename );
    fs.mkdir( dir, ( ) => {
      fs.exists( cachePath, exists => {
        if ( exists === true ) {
          return callback( null, cachePath );
        }
        ImageCache.downloadFile( url, cachePath, callback );
      });
    });
  }

  static downloadFile( url, cachePath, callback ) {
    console.log( "Attempting to download " + url );
    request({ url: url, timeout: 10000, encoding: "binary" }, ( error, response, body ) => {
      if ( error || response.statusCode !== 200 ) {
        return callback( error || { error: "download failed" } );
      }
      fs.writeFile( cachePath, body, "binary", err => {
        if( err ) { return callback( err ); }
        callback( null, cachePath );
      });
    });
  }

  static checksum( str, algorithm, encoding ) {
    return crypto.
      createHash( algorithm || "md5" ).
      update( str, "utf8" ).
      digest( encoding || "hex" );
  }
}

module.exports = ImageCache;
