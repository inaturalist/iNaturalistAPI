const pg = require( "pg" );
const moment = require( "moment-timezone" );
const config = require( "../config" );

// overriding default `timestamp without time zone` behavior
// to assume all times are UTC. Read more at github:brianc/node-postgres#429
const { types } = pg;
const timestampOID = 1114;
moment.tz.setDefault( "UTC" );
types.setTypeParser( timestampOID, stringValue => (
  moment( stringValue ).format( "YYYY-MM-DDTHH:mm:ssZ" )
) );

// Always use "inaturalist_test" for test environment
// Use the INAT_DB_NAME environment value if defined
// By default, use "inaturalist_" suffixed by the environment name
const dbname = process.env.NODE_ENV === "test" ? "inaturalist_test" : ( process.env.INAT_DB_NAME || `inaturalist_${process.env.NODE_ENV}` );
const pgConfig = {
  user: config.database.user,
  password: config.database.password,
  host: config.database.host,
  port: config.database.port,
  database: dbname,
  ssl: config.database.ssl,
  max: ( global.config && global.config.pgPoolMax ) ? global.config.pgPoolMax : 10
};

const pool = new pg.Pool( pgConfig );

module.exports = pool;
