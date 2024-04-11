const _ = require( "lodash" );
const pg = require( "pg" );
const moment = require( "moment-timezone" );
const chalk = require( "chalk" );
const { hrtime } = require( "process" );
const util = require( "../util" );
const config = require( "../../config" );

// overriding default `timestamp without time zone` behavior
// to assume all times are UTC. Read more at github:brianc/node-postgres#429
const { types } = pg;
const timestampOID = 1114;
moment.tz.setDefault( "UTC" );
types.setTypeParser( timestampOID, stringValue => (
  moment( stringValue ).format( "YYYY-MM-DDTHH:mm:ssZ" )
) );

const PgPoolConnection = class PgPoolConnection {
  constructor( customConfig = { } ) {
    const pgConfig = {
      user: config.database.user,
      password: config.database.password,
      host: config.database.host,
      port: config.database.port,
      database: PgPoolConnection.buildDbName( ),
      ssl: config.database.ssl,
      max: process.env.PG_POOL_MAX ? process.env.PG_POOL_MAX : 10
    };
    this.pool = new pg.Pool( { ...pgConfig, ...customConfig } );
    this.connectionLabel = customConfig.connectionLabel || "primary";
  }

  static buildDbName( ) {
    // Throw exception if NODE_ENV is not set
    if ( _.isEmpty( process.env.NODE_ENV ) ) {
      throw new Error( "env.NODE_ENV is not set" );
    }
    // Always use "inaturalist_test" for test environment
    // Use the INAT_DB_NAME environment value if defined
    // By default, use "inaturalist_" suffixed by the environment name
    return process.env.NODE_ENV === "test"
      ? "inaturalist_test"
      : ( process.env.INAT_DB_NAME || `inaturalist_${process.env.NODE_ENV}` );
  }

  static customLogger( query, hrRuntime, connectionLabel = "primary" ) {
    if ( !( config.debug && config.logLevel && config.logLevel === "debug"
      && process.env.NODE_ENV !== "test" )
    ) {
      return;
    }
    /* global BigInt */
    const runtime = _.round( Number( hrRuntime / BigInt( 1000 ) ) / 1000, 1 );
    PgPoolConnection.debug( `  ${chalk.cyan.bold( `[${connectionLabel}] (${runtime}ms)` )} ${chalk.blue.bold( query )}` );
  }

  async query( query, values = undefined ) {
    const startTime = hrtime.bigint( );
    const results = await this.pool.query( query, values );
    const queryTime = hrtime.bigint( ) - startTime;
    PgPoolConnection.customLogger( query, queryTime, this.connectionLabel );
    return results;
  }

  static debug( str ) {
    util.debug( str );
  }
};

module.exports = PgPoolConnection;
