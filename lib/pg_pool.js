const _ = require( "lodash" );
const pg = require( "pg" );
const moment = require( "moment-timezone" );
const chalk = require( "chalk" );
const { hrtime } = require( "process" );
const util = require( "./util" );
const config = require( "../config" );

// overriding default `timestamp without time zone` behavior
// to assume all times are UTC. Read more at github:brianc/node-postgres#429
const { types } = pg;
const timestampOID = 1114;
moment.tz.setDefault( "UTC" );
types.setTypeParser( timestampOID, stringValue => (
  moment( stringValue ).format( "YYYY-MM-DDTHH:mm:ssZ" )
) );

const PgPool = class PgPool {
  constructor( ) {
    const pgConfig = {
      user: config.database.user,
      password: config.database.password,
      host: config.database.host,
      port: config.database.port,
      database: this.buildDbName( ),
      ssl: config.database.ssl,
      max: ( global.config && global.config.pgPoolMax ) ? global.config.pgPoolMax : 10
    };
    this.pool = new pg.Pool( pgConfig );
  }

  buildDbName( ) {
    // Always use "inaturalist_test" for test environment
    // Use the INAT_DB_NAME environment value if defined
    // By default, use "inaturalist_" suffixed by the environment name
    return process.env.NODE_ENV === "test" ? "inaturalist_test" : ( process.env.INAT_DB_NAME || `inaturalist_${process.env.NODE_ENV}` );
  }

  static customLogger( query, hrRuntime ) {
    if ( !( config.debug && config.logLevel && config.logLevel === "debug"
      && process.env.NODE_ENV !== "test" )
    ) {
      return;
    }
    /* global BigInt */
    const runtime = _.round( Number( hrRuntime / BigInt( 1000 ) ) / 1000, 1 );
    PgPool.debug( `  ${chalk.cyan.bold( `[primary] (${runtime}ms)` )} ${chalk.blue.bold( query )}` );
  }

  async query( query, values = undefined ) {
    const startTime = hrtime.bigint( );
    const results = await this.pool.query( query, values );
    const queryTime = hrtime.bigint( ) - startTime;
    PgPool.customLogger( query, queryTime );
    return results;
  }

  static debug( str ) {
    util.debug( str );
  }
};

module.exports = new PgPool( );
