const _ = require( "lodash" );
const zlib = require( "zlib" );
const redis = require( "redis" );
const { promisify } = require( "util" );
const util = require( "../util" );
const config = require( "../../config" );

const zlibInflateAsync = promisify( zlib.inflate );
const zlibDeflateAsync = promisify( zlib.deflate );

const RedisConnection = class RedisConnection {
  static initialize( options = { } ) {
    let redisClient = { };
    let connected;
    if ( config.redis && config.redis.port && config.redis.host ) {
      redisClient = redis.createClient( Object.assign( {
        socket: {
          port: config.redis.port,
          host: config.redis.host,
          connectTimeout: 10000
        }
      }, options ) );

      redisClient.on( "error", err => {
        // eslint-disable-next-line no-console
        console.log( "RedisError" );
        console.trace( err );
      } );

      redisClient.on( "connect", ( ) => {
        connected = true;
      } );

      redisClient.on( "reconnecting", ( ) => {
        connected = false;
      } );

      redisClient.on( "end", ( ) => {
        connected = false;
      } );

      redisClient.connect();
    }

    redisClient.setCompressed = async ( key, value, expiration ) => {
      if ( !connected ) { return; }
      const buffer = await zlibDeflateAsync( value );
      await redisClient.set( key, buffer.toString( "base64" ), "EX", expiration );
    };

    redisClient.getCompressed = async ( key, opts = { } ) => {
      if ( !connected ) { return null; }
      const value = await redisClient.get( key );
      if ( value ) {
        const buffer = await zlibInflateAsync( Buffer.from( value, "base64" ) );
        const str = buffer.toString( );
        if ( opts.json ) {
          try {
            const parsed = JSON.parse( str );
            return parsed;
          } catch ( err ) {
            return null;
          }
        }
        return str;
      }
      return null;
    };

    redisClient.getOrSetJSON = async ( key, expiration, asyncMethod ) => {
      if ( _.isEmpty( key ) || !connected ) {
        return asyncMethod( );
      }
      const cachedJSON = await redisClient.getCompressed( key, { json: true } );
      if ( cachedJSON ) {
        util.debug( ["RedisConnection", "returning from cache", key] );
        return cachedJSON;
      }
      const methodResponse = await asyncMethod( );
      util.debug( ["RedisConnection", "caching", key] );
      await redisClient.setCompressed( key, JSON.stringify( methodResponse ), expiration );
      return methodResponse;
    };

    return redisClient;
  }
};

module.exports = RedisConnection;
