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

pgClient.connect = async ( ) => {
  if ( pgClient.connection ) { return pgClient.connection; }
  const pgConfig = {
    user: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    database: `inaturalist_${process.env.NODE_ENV || config.environment}`,
    ssl: config.database.ssl
  };
  const client = new pg.Client( pgConfig );
  await client.connect( );
  pgClient.connection = client;
  return pgClient.connection;
};

pgClient.connect( );

module.exports = pgClient;
