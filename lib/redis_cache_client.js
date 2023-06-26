const RedisConnection = require( "./models/redis_connection" );

const redisCacheClient = new RedisConnection( { database: 1 } );
redisCacheClient.connect( );
module.exports = redisCacheClient;
