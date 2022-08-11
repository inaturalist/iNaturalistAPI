const _ = require( "lodash" );
const pg = require( "pg" );
const moment = require( "moment-timezone" );
const chalk = require( "chalk" );
const timersPromises = require( "timers/promises" );
const { hrtime } = require( "process" );
const config = require( "../config" );

const { Query } = pg;
const { submit } = Query.prototype;

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
    const pgConfig = {
      user: config.database.user,
      password: config.database.password,
      host: config.database.host,
      port: config.database.port,
      database: config.database.dbname,
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
    this.connection.connection.customLogger = this.customLogger;
    this.connecting = false;
    return this.connection;
  }

  customLogger( query, hrRuntime ) {
    const runtime = _.round( Number( hrRuntime / 1000n ) / 1000, 1 );
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
    this.customLogger( query, queryTime );
    return results;
  }

  static debug( str ) {
    if ( config.debug && config.logLevel && config.logLevel === "debug" && process.env.NODE_ENV !== "test" ) {
      // eslint-disable-next-line no-console
      console.log( str );
    }
  }
};

// Query.prototype.submit = function ( ...args ) {
//   const connection = args[0];
//   if (
//     connection
//     && connection.constructor.name === "Connection"
//     && _.has( connection, "customLogger" )
//   ) {
//     const { text } = this;
//     const values = this.values || [];
//     const query = text.replace( /\$([0-9]+)/g,
//       ( m, v ) => JSON.stringify( values[_.parseInt( v ) - 1] ) );
//     connection.customLogger( query );
//   }
//   const startTime = Date.now( );
//   submit.apply( this, args );
//   console.log( startTime - Date.now( ) );
// };

// pgClient.connect( )
//   .then( { } )
//   .catch( e => {
//     console.log( e );
//     process.exit( );
//   } );

module.exports = new PgConnection( );
