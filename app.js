/* eslint no-console: 0 */
"use strict";
const fs = require( "fs" );
const path = require( "path" );
const Logstasher = require( "./lib/logstasher" );

// NewRelic is stats module, which needs newrelic.js in the app root
// do as little as possible before loading NewRelic
var newrelic_path = path.join( path.dirname( fs.realpathSync( __filename ) ), "newrelic.js" );
if( fs.existsSync( newrelic_path ) ) {
  require( "newrelic" );
}

var InaturalistAPI = require( "./lib/inaturalist_api" );
var port = Number( process.env.PORT || 4000 );
Logstasher.setLogStreamFilePath( `inaturalist_api.${port}.log` );
var app = InaturalistAPI.server( );
app.listen( port, function( ) {
  console.log( "Listening on " + port );
});
