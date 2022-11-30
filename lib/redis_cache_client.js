const RedisConnection = require( "./models/redis_connection" );

module.exports = new RedisConnection( { database: 1 } );
