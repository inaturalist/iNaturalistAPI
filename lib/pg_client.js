const pg = require( "pg" );
const moment = require( "moment-timezone" );
const config = require( "../config" );
const util = require( "./util" );

const pgClient = { connection: null };

// overriding default `timestamp without time zone` behavior
// to assume all times are UTC. Read more at github:brianc/node-postgres#429
const { types } = pg;
const timestampOID = 1114;
moment.tz.setDefault( "UTC" );
types.setTypeParser( timestampOID, stringValue => (
  moment( stringValue ).format( "YYYY-MM-DDTHH:mm:ssZ" )
) );

pgClient.connect = callback => {
  if ( pgClient.connection ) { return void callback( null, pgClient.connection ); }
  const pgConfig = {
    user: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    database: config.database.dbname,
    ssl: config.database.ssl
  };
  const c = new pg.Client( pgConfig );
  c.connect( ( err, client ) => {
    if ( err ) { return void callback( err ); }
    pgClient.connection = client;
    callback( null, pgClient.connection );
  } );
};

pgClient.connect( err => {
  if ( err ) { util.debug( err ); }
} );

module.exports = pgClient;
