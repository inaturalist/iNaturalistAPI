const _ = require( "lodash" );
const zlib = require( "zlib" );
const redis = require( "redis" );
const { promisify } = require( "util" );
const timersPromises = require( "timers/promises" );
const { hrtime } = require( "process" );
const chalk = require( "chalk" );
const util = require( "../util" );
const config = require( "../../config" );

const zlibInflateAsync = promisify( zlib.inflate );
const zlibDeflateAsync = promisify( zlib.deflate );

const RedisConnection = class RedisConnection {
  constructor( options = { } ) {
    this.connectOptions = options;
  }

  async connect( ) {
    if ( this.redisClient || this.connectFailed ) { return this.redisClient; }
    if ( this.connecting ) {
      return this.awaitConnection( 10 );
    }
    this.redisClient = null;
    this.connected = false;
    this.connectFailed = false;
    if ( config.redis && config.redis.port && config.redis.host ) {
      RedisConnection.debug( "Connecting to redis..." );
      this.connecting = true;
      this.redisClient = redis.createClient( {
        socket: {
          port: config.redis.port,
          host: config.redis.host,
          connectTimeout: 10000
        },
        ...this.connectOptions
      } );

      this.redisClient.on( "error", err => {
        RedisConnection.debug( "RedisError", err );
      } );

      this.redisClient.on( "connect", ( ) => {
        this.connected = true;
        this.connecting = false;
      } );

      this.redisClient.on( "reconnecting", ( ) => {
        this.connected = false;
        this.connecting = true;
      } );

      this.redisClient.on( "end", ( ) => {
        this.connected = false;
        this.connecting = false;
      } );

      await this.redisClient.connect( );
    } else {
      RedisConnection.debug( "Redis not configured..." );
    }
    if ( !this.redisClient ) { this.connectFailed = true; }
    return this.redisClient;
  }

  async awaitConnection( numberOfAttempts = 1 ) {
    RedisConnection.debug( "Awaiting DB connection..." );
    await timersPromises.setTimeout( 1000 );
    if ( this.redisClient ) { return this.redisClient; }
    numberOfAttempts -= 1;
    if ( numberOfAttempts === 0 ) {
      RedisConnection.debug( new Error( "Couldn't connect to redis" ) );
      return false;
    }
    return this.awaitConnection( numberOfAttempts );
  }

  async setCompressed( key, value, expiration ) {
    await this.connect( );
    if ( !this.connected ) { return; }
    const buffer = await zlibDeflateAsync( value );
    await this.redisClient.set( key, buffer.toString( "base64" ), { EX: expiration } );
  }

  async getCompressed( key, opts = { } ) {
    await this.connect( );
    if ( !this.connected ) { return null; }
    const value = await this.redisClient.get( key );
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
  }

  async getOrSetJSON( key, expiration, asyncMethod ) {
    await this.connect( );
    if ( _.isEmpty( key ) || !this.connected ) {
      return asyncMethod( );
    }
    const startTime = hrtime.bigint( );
    const cachedJSON = await this.getCompressed( key, { json: true } );
    if ( cachedJSON ) {
      if ( process.env.NODE_ENV !== "test" ) {
        const queryTime = hrtime.bigint( ) - startTime;
        const runtime = _.round( Number( queryTime / 1000n ) / 1000, 1 );
        const remainingTTL = await this.redisClient.ttl( key );
        RedisConnection.debug( `  ${chalk.magenta.bold( `[redis] (${runtime}ms)` )} ${chalk.green.bold( "Returning cached:" )} ${chalk.yellow.bold( key )} ${chalk.green.bold( `[ttl: ${remainingTTL}]` )}` );
      }
      return cachedJSON;
    }
    const methodResponse = await asyncMethod( );
    // RedisConnection.debug( ["RedisConnection", "caching", key] );
    await this.setCompressed( key, JSON.stringify( methodResponse ), expiration );
    const queryTime = hrtime.bigint( ) - startTime;
    const runtime = _.round( Number( queryTime / 1000n ) / 1000, 1 );
    RedisConnection.debug( `  ${chalk.magenta.bold( `[redis] (${runtime}ms)` )} ${chalk.green.bold( "Adding to cache:" )} ${chalk.yellow.bold( key )} ${chalk.green.bold( `[ttl: ${expiration}]` )}` );
    return methodResponse;
  }

  static debug( str, err = null ) {
    util.debug( str );
    if ( err ) {
      // eslint-disable-next-line no-console
      console.trace( err );
    }
  }
};

module.exports = RedisConnection;
