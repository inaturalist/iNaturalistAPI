var pg = require( "pg" ),
    config = require( "../config" ),
    pgClient = { connection: null };

pgClient.connect = function( ) {
  if( pgClient.connection ) { return pgClient.connection; }
  var pgConfig = {
    user: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    database: "inaturalist_" + ( process.env.NODE_ENV || config.environment ),
    ssl: config.database.ssl
  };
  var c = new pg.Client( pgConfig );
  c.connect( function( err, client, done ) {
    if( err ) { console.log(err); return; }
    pgClient.connection = client;
  });
};

pgClient.connect( );

module.exports = pgClient;
