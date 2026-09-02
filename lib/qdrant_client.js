const _ = require( "lodash" );
const { QdrantClient } = require( "@qdrant/js-client-rest" );
const { hrtime } = require( "process" );
const chalk = require( "chalk" );
const config = require( "../config" );

const qdrantClient = { connection: null };

qdrantClient.connect = async ( ) => {
  if ( !config.qdrant ) { return null; }
  if ( qdrantClient.connection ) { return qdrantClient.connection; }

  const { url, apiKey } = config.qdrant;
  try {
    qdrantClient.connection = new QdrantClient( {
      url,
      apiKey
    } );
    await qdrantClient.connection._openApiClient.root( {} );
  } catch ( err ) {
    qdrantClient.connection = null;
  }
  return qdrantClient.connection;
};

qdrantClient.connected = ( ) => ( !!qdrantClient.connection );

qdrantClient.query = async ( collectionName, parameters ) => {
  const loggingEnabled = ( config.debug && config.logLevel
    && config.logLevel === "debug" && process.env.NODE_ENV !== "test" );
  let startTime;
  if ( loggingEnabled ) {
    startTime = hrtime.bigint( );
  }
  const prefixedCollectionName = qdrantClient.buildCollectionName( collectionName );
  const qdrantResponse = await qdrantClient.connection.query( prefixedCollectionName, parameters );
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
