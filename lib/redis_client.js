const RedisConnection = require( "./models/redis_connection" );

module.exports = RedisConnection.initialize( { db: 0 } );
