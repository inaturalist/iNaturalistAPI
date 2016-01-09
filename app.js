var fs = require( "fs" ),
    path = require( "path" );

// NewRelic is stats module, which needs newrelic.js in the app root
// do as little as possible before loading NewRelic
var newrelic_path = path.join( path.dirname( fs.realpathSync( __filename ) ), "newrelic.js" );
if( fs.existsSync( newrelic_path ) ) {
  var newrelic = require( "newrelic" );
}

var InaturalistAPI = require( "./lib/inaturalist_api" );
var app = InaturalistAPI.server( );
var port = Number( process.env.PORT || 4000 );
server = app.listen( port, function( ) {
  console.log( "Listening on " + port );
});
