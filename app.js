var fs = require( "fs" ),
    path = require( "path" ),
    util = require( "./lib/util" );
// NewRelic is stats module, which needs newrelic.js in the app root
if( fs.existsSync( path.join(path.dirname(fs.realpathSync(__filename)), "newrelic.js") ) ) {
  var newrelic = require( "newrelic" );
}

var ElasticMapper = require( "elasticmaps" ),
    InaturalistMapserver = require( "./lib/inaturalist_map_server" ),
    routes = require( "./lib/routes" ),
    _ = require( "underscore" ),
    jade = require( "jade" ),
    express = require( "express" ),
    bodyParser = require( "body-parser" ),
    compression = require( "compression" ),
    config = require( "./config" );

var app = ElasticMapper.server( _.extend( config, {
  beforePrepareQuery: InaturalistMapserver.beforePrepareQuery,
  prepareQuery: InaturalistMapserver.prepareQuery,
  prepareStyle: InaturalistMapserver.prepareStyle,
  beforeSendResult: InaturalistMapserver.beforeSendResult
}));

app.use( compression( ) );
app.use( bodyParser.json( ) );
app.use( express.static( "public" ) );
app.set( "view engine", "jade" );

app.use( function( req, res, next ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  res.header( "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept" );
  next( );
});

// log request times
app.use( function( req, res, next ) {
  if( res.statusCode != "200" ) { return next( ); }
  var startTime = Date.now( );
  res.on( "finish", function( ) {
    var totalTime = Date.now( ) - startTime;
    var logText = "[ "+ new Date( ).toString( ) + "] GET " +
      req.url + " " + totalTime + "ms";
    util.debug( logText );
  });
  next( );
});

// map tile routes
app.get( "/places/:place_id/:zoom/:x/:y.:format([a-z\.]+)", InaturalistMapserver.placesRoute );
app.get( "/taxon_places/:taxon_id/:zoom/:x/:y.:format([a-z\.]+)", InaturalistMapserver.taxonPlacesRoute );
app.get( "/taxon_ranges/:taxon_id/:zoom/:x/:y.:format([a-z\.]+)", InaturalistMapserver.taxonRangesRoute );

// JSON API routes
app.get( "/", routes.index );
app.get( "/observations", routes.observations_index );
app.get( "/observations/stats", routes.observations_stats );
app.get( "/observations/identifiers", routes.observations_identifiers );
app.get( "/observations/observers", routes.observations_observers );
app.get( "/observations/species_count", routes.species_count );
app.get( "/observations/species_counts", routes.species_counts );
app.get( "/observations/:id", routes.observations_show );
app.get( "/taxa/autocomplete", routes.taxa_autocomplete );
app.get( "/taxa/:id", routes.taxa_show );
app.get( "/places/nearby", routes.places_nearby );
app.get( "/places/:id", routes.places_show );

var port = Number( process.env.PORT || 4000 );
server = app.listen( port, function( ) {
  console.log( "Listening on " + port );
});

require( "./lib/socket" ).connect( server );
