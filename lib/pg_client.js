const _ = require( "lodash" );
const pg = require( "pg" );
const moment = require( "moment-timezone" );
const chalk = require( "chalk" );
const timersPromises = require( "timers/promises" );
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

const PgConnection = class PgConnection {
  constructor( ) {
    this.connection = null;
  }

  async connect( customConfig = { } ) {
    if ( this.connection ) { return this.connection; }
    if ( this.connecting ) {
      return this.awaitConnection( 10 );
    }
    this.connecting = true;
    PgConnection.debug( "Connecting to DB..." );
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
      ssl: config.database.ssl
    };
    const client = new pg.Client( { ...pgConfig, ...customConfig } );
    let connectError;
    try {
      await client.connect( );
      this.connection = client;
    } catch ( e ) {
      connectError = e;
    }
    if ( !this.connection ) {
      this.connecting = false;
      throw connectError || new Error( "Couldn't connect to database" );
    }
    this.connection.connection.customLogger = PgConnection.customLogger;
    this.connecting = false;
    return this.connection;
  }

  static customLogger( query, hrRuntime ) {
    if ( !( config.debug && config.logLevel && config.logLevel === "debug"
      && process.env.NODE_ENV !== "test" )
    ) {
      return;
    }
    /* global BigInt */
    const runtime = _.round( Number( hrRuntime / BigInt( 1000 ) ) / 1000, 1 );
    PgConnection.debug( `  ${chalk.cyan.bold( `[primary] (${runtime}ms)` )} ${chalk.blue.bold( query )}` );
  }

  async awaitConnection( numberOfAttempts = 1 ) {
    PgConnection.debug( "Awaiting DB connection..." );
    await timersPromises.setTimeout( 1000 );
    if ( this.connection ) { return this.connection; }
    numberOfAttempts -= 1;
    if ( numberOfAttempts === 0 ) {
      PgConnection.debug( new Error( "Couldn't connect to database" ) );
      process.exit( );
    }
    return this.awaitConnection( numberOfAttempts );
  }

  async query( query, values = undefined ) {
    await this.connect( );
    const startTime = hrtime.bigint( );
    const results = await this.connection.query( query, values );
    const queryTime = hrtime.bigint( ) - startTime;
    PgConnection.customLogger( query, queryTime );
    return results;
  }

  static debug( str ) {
    util.debug( str );
  }
};

module.exports = new PgConnection( );
