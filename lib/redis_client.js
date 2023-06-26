const RedisConnection = require( "./models/redis_connection" );

const redisClient = new RedisConnection( { database: 0 } );
redisClient.connect( );
module.exports = redisClient;
