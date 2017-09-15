/* eslint no-console: 0 */
"use strict";
var fs = require( "fs" ),
    path = require( "path" );

// NewRelic is stats module, which needs newrelic.js in the app root
// do as little as possible before loading NewRelic
var newrelic_path = path.join( path.dirname( fs.realpathSync( __filename ) ), "newrelic.js" );
if( fs.existsSync( newrelic_path ) ) {
  require( "newrelic" );
}

var InaturalistAPI = require( "./lib/inaturalist_api" );
var port = Number( process.env.PORT || 4000 );
var logWriteStream = fs.createWriteStream( `inaturalist_api.${port}.log`, { flags : "a" } );
var app = InaturalistAPI.server( logWriteStream );
app.listen( port, function( ) {
  console.log( "Listening on " + port );
});
