const _ = require( "lodash" );
const { QdrantClient } = require( "@qdrant/js-client-rest" );
const { hrtime } = require( "process" );
const chalk = require( "chalk" );
const config = require( "../config" );

const qdrantClient = {
  connection: null,
  connectRetryDelay: 10,
  lastConnectCheck: null
};

qdrantClient.connect = async ( ) => {
  if ( !config.qdrant ) { return null; }
  if ( qdrantClient.connection ) { return qdrantClient.connection; }

  const currentTime = Date.now( );
  if ( qdrantClient.lastConnectCheck ) {
    const secondsSinceLastCheck = ( currentTime - qdrantClient.lastConnectCheck ) / 1000;
    if ( secondsSinceLastCheck < qdrantClient.connectRetryDelay ) {
      return null;
    }
  }

  qdrantClient.lastConnectCheck = currentTime;
  const { url, apiKey } = config.qdrant;
  try {
    const connection = new QdrantClient( {
      url,
      apiKey,
      timeout: 5000
    } );
    await connection._openApiClient.root( {} );
    qdrantClient.connection = connection;
  } catch ( err ) {
    // do nothing
  }
  return qdrantClient.connection;
};

qdrantClient.connected = ( ) => ( !!qdrantClient.connection );

qdrantClient.query = async ( collectionName, parameters ) => {
  const connection = await qdrantClient.connect( );
  if ( !connection ) {
    return { };
  }
  const loggingEnabled = ( config.debug && config.logLevel
    && config.logLevel === "debug" && process.env.NODE_ENV !== "test" );
  let startTime;
  if ( loggingEnabled ) {
    startTime = hrtime.bigint( );
  }
  const prefixedCollectionName = qdrantClient.buildCollectionName( collectionName );
  let qdrantResponse;
  try {
    qdrantResponse = await connection.query( prefixedCollectionName, parameters );
  } catch ( error ) {
    if ( error instanceof TypeError && error.message === "fetch failed" ) {
      if ( qdrantClient.connection === connection ) {
        qdrantClient.connection = null;
      }
      return { };
    }
    throw error;
  }
  if ( !loggingEnabled ) {
    return qdrantResponse;
  }

  let log = `  ${chalk.magenta.bold( "[qdrant]" )}`;
  const queryTime = hrtime.bigint( ) - startTime;
  /* global BigInt */
  const runtime = _.round( Number( queryTime / BigInt( 1000 ) ) / 1000, 1 );
  log += chalk.yellow.bold( ` (${runtime}ms)` );
  const logObject = {
    collection: collectionName,
    body: parameters
  };
  const paramsOutput = JSON.stringify( logObject, null, "  " ).replace( /\n/g, "\n    " );
  // eslint-disable-next-line no-console
  console.log( `${log} ${chalk.green( paramsOutput )}` );

  return qdrantResponse;
};

qdrantClient.buildCollectionName = collectionName => {
  // Throw exception if NODE_ENV is not set
  if ( _.isEmpty( process.env.NODE_ENV ) ) {
    throw new Error( "env.NODE_ENV is not set" );
  }
  // Always prefix with test for test environment
  if ( process.env.NODE_ENV === "test" ) {
    return `test_${collectionName}`;
  }
  // Use prefix defined in env if available
  if ( process.env.INAT_QDRANT_COLLECTION_PREFIX ) {
    return `${process.env.INAT_QDRANT_COLLECTION_PREFIX}_${collectionName}`;
  }
  // Use env by default
  return `${process.env.NODE_ENV}_${collectionName}`;
};

qdrantClient.connect( );

module.exports = qdrantClient;
