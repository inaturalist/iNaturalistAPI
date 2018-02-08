"use strict";
const _ = require( "lodash" ),
      fs = require( "fs" ),
      path = require( "path" ),
      crypto = require( "crypto" );

var FileCache = class FileCache {

  static cacheFile( key, contents ) {
    if ( _.isEmpty( key ) || _.isEmpty( contents ) ) { return; }
    const pathInfo = FileCache.cachePathInfo( key );
    if ( !fs.existsSync( pathInfo.dir1 ) ) {
      fs.mkdirSync( pathInfo.dir1 );
    }
    if ( !fs.existsSync( pathInfo.dir2 ) ) {
      fs.mkdirSync( pathInfo.dir2 );
    }
    if ( fs.existsSync( pathInfo.path ) ) { return; }
    fs.writeFileSync( pathInfo.path, contents );
  }

  static cacheExists( key ) {
    const pathInfo = FileCache.cachePathInfo( key );
    if ( !fs.existsSync( pathInfo.path ) ) { return; }
    return fs.readFileSync( pathInfo.path, "utf8" );
  }

  static cachePathInfo( key ) {
    const hash = FileCache.checksum( key );
    const dir1 = path.resolve( __dirname, "file_cache", hash.substr( 0, 2 ) );
    const dir2 = path.resolve( dir1, hash.substr( 2, 2 ) );
    return { dir1, dir2, path: path.resolve( dir2, hash ) };
  }

  static checksum( str, algorithm, encoding ) {
    return crypto.
      createHash( algorithm || "md5" ).
      update( str, "utf8" ).
      digest( encoding || "hex" );
  }
}

module.exports = FileCache;
