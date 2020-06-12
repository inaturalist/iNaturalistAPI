const pg = require( "pg" );
const moment = require( "moment-timezone" );
const config = require( "../config" );

const pgClient = { connection: null };

// overriding default `timestamp without time zone` behavior
// to assume all times are UTC. Read more at github:brianc/node-postgres#429
const { types } = pg;
const timestampOID = 1114;
moment.tz.setDefault( "UTC" );
types.setTypeParser( timestampOID, stringValue => (
  moment( stringValue ).format( "YYYY-MM-DDTHH:mm:ssZ" )
) );

pgClient.connect = async cfg => {
  if ( pgClient.connection ) { return pgClient.connection; }
  const thisConfig = Object.assign( {}, config, cfg );
  const pgConfig = {
    user: thisConfig.database.user,
    password: thisConfig.database.password,
    host: thisConfig.database.host,
    port: thisConfig.database.port,
    database: thisConfig.database.dbname,
    ssl: thisConfig.database.ssl
  };
  const client = new pg.Client( pgConfig );
  await client.connect( );
  pgClient.connection = client;
  if ( !pgClient.connection ) {
    throw new Error( "Couldn't connect to database" );
  }
  return pgClient.connection;
};

pgClient.connect( );

module.exports = pgClient;
