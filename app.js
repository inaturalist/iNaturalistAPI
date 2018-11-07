/* eslint no-console: 0 */
const fs = require( "fs" );
const path = require( "path" );
const Logstasher = require( "./lib/logstasher" );

// NewRelic is stats module, which needs newrelic.js in the app root
// do as little as possible before loading NewRelic
const newrelicPath = path.join( path.dirname( fs.realpathSync( __filename ) ), "newrelic.js" );
if ( fs.existsSync( newrelicPath ) ) {
  require( "newrelic" ); // eslint-disable-line global-require
}

const InaturalistAPI = require( "./lib/inaturalist_api" ); // eslint-disable-line global-require

const port = Number( process.env.PORT || 4000 );
Logstasher.setLogStreamFilePath( `inaturalist_api.${port}.log` );
const app = InaturalistAPI.server( );
app.listen( port, ( ) => {
  console.log( `Listening on ${port}` );
} );
