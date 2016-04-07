var pg = require( "pg" ),
    moment = require( "moment-timezone" ),
    config = require( "../config" ),
    util = require( "./util" ),
    pgClient = { connection: null };

// overriding default `timestamp without time zone` behavior
// to assume all times are UTC. Read more at github:brianc/node-postgres#429
var types = pg.types;
var timestampOID = 1114;
moment.tz.setDefault( "UTC" );
types.setTypeParser( timestampOID, function( stringValue ) {
  return moment( stringValue ).format( );
});

pgClient.connect = function( callback ) {
  if( pgClient.connection ) { return callback( null, pgClient.connection ); }
  var pgConfig = {
    user: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    database: "inaturalist_" + ( process.env.NODE_ENV || config.environment ),
    ssl: config.database.ssl
  };
  var c = new pg.Client( pgConfig );
  c.connect( function( err, client ) {
    if( err ) { return callback( err ); }
    pgClient.connection = client;
    callback( null, pgClient.connection );
  });
};

pgClient.connect( function( err ) {
  if( err ) { util.debug(err); }
});

module.exports = pgClient;
