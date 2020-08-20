const fs = require( "fs" );
const path = require( "path" );
const Logstasher = require( "./lib/logstasher" );

// NewRelic is stats module, which needs newrelic.js in the app root
// do as little as possible before loading NewRelic
const newrelicPath = path.join( path.dirname( fs.realpathSync( __filename ) ), "newrelic.js" );
if ( fs.existsSync( newrelicPath ) ) {
  require( "newrelic" ); // eslint-disable-line global-require
}

const InaturalistAPI = require( "./lib/inaturalist_api" );
const InaturalistAPIV2 = require( "./lib/inaturalist_api_v2" );

const PORT = Number( process.env.PORT || 4000 );

const main = ( ) => {
  const logstashPath = path.join(
    path.dirname( fs.realpathSync( __filename ) ), "./log", `inaturalist_api.${PORT}.log`
  );
  Logstasher.setLogStreamFilePath( logstashPath );

  // prepare the v1 API
  const app = InaturalistAPI.server( );
  // add on v2 openapi endpoints
  InaturalistAPIV2.initializeOpenapi( app );
  return app;
};

if ( require.main === module ) {
  main( ).listen( PORT );
  if ( process.pid ) {
    console.log( `This process is your pid: ${process.pid}` );
  }
}

module.exports = main( );
