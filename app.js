var fs = require( "fs" ),
    path = require( "path" );
// NewRelic is stats module, which needs newrelic.js in the app root
if( fs.existsSync( path.join(path.dirname(fs.realpathSync(__filename)), "newrelic.js") ) ) {
  var newrelic = require( "newrelic" );
}

var ElasticMapper = require( "elasticmaps" ),
    InaturalistMapserver = require( "./lib/inaturalist_map_server" ),
    InaturalistAPI = require( "./lib/inaturalist_api" ),
    routes = require( "./lib/routes" ),
    util = require( "./lib/util" ),
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
app.use( util.accessControlHeaders );
// log request times
app.use( util.timingMiddleware );
// lookup, and temporarily cache, a few instances
app.use( InaturalistAPI.lookupTaxonMiddleware );
app.use( InaturalistAPI.lookupPlaceMiddleware );
app.use( InaturalistAPI.lookupPreferredPlaceMiddleware );


// map tile routes
app.get( "/places/:place_id/:zoom/:x/:y.:format([a-z\.]+)", InaturalistMapserver.placesRoute );
app.get( "/taxon_places/:taxon_id/:zoom/:x/:y.:format([a-z\.]+)", InaturalistMapserver.taxonPlacesRoute );
app.get( "/taxon_ranges/:taxon_id/:zoom/:x/:y.:format([a-z\.]+)", InaturalistMapserver.taxonRangesRoute );

// JSON API routes
app.get( "/", routes.index );
app.get( "/observations", routes.observations_index );
app.get( "/observations/identifiers", routes.observations_identifiers );
app.get( "/observations/observers", routes.observations_observers );
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
