const zlib = require( "zlib" );
const redis = require( "redis" );
const { promisify } = require( "util" );
const config = require( "../config" );

let redisClient = { };

if ( config.redis && config.redis.port && config.redis.host ) {
  redisClient = redis.createClient(
    config.redis.port, config.redis.host, { return_buffers: true }
  );

  redisClient.on( "error", err => {
    console.log( ["RedisError", err] );
  } );

  redisClient.getAsync = promisify( redisClient.get ).bind( redisClient );
  redisClient.setAsync = promisify( redisClient.set ).bind( redisClient );
  redisClient.delAsync = promisify( redisClient.del ).bind( redisClient );

  redisClient.setCompressed = ( key, value, expiration ) => (
    new Promise( ( resolve, reject ) => {
      zlib.deflate( value, ( err, buffer ) => {
        if ( err ) { return void reject( err ); }
        redisClient.set( key, buffer, "EX", expiration, resolve );
      } );
    } )
  );

  redisClient.getCompressed = ( key, options = { } ) => (
    new Promise( ( resolve, reject ) => {
      redisClient.getAsync( key ).then( value => {
        if ( value ) {
          zlib.inflate( value, ( err, buffer ) => {
            if ( err ) { return void reject( err ); }
            const str = buffer.toString( );
            if ( options.json ) {
              try {
                const parsed = JSON.parse( str );
                resolve( parsed );
              } catch ( errr ) {
                reject( errr );
              }
            } else {
              resolve( str );
            }
          } );
        } else {
          resolve( );
        }
      } ).catch( e => {
        reject( e );
      } );
    } )
  );
}

module.exports = redisClient;
