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

var prepareApp = function( a ) {
  a.use( compression( ) );
  a.use( bodyParser.json( ) );
  a.use( express.static( "public" ) );
  a.set( "view engine", "jade" );
  a.use( util.accessControlHeaders );
  // lookup, and temporarily cache, a few instances
  a.use( InaturalistAPI.lookupTaxonMiddleware );
  a.use( InaturalistAPI.lookupPlaceMiddleware );
  a.use( InaturalistAPI.lookupPreferredPlaceMiddleware );
  a.use( InaturalistAPI.lookupProjectMiddleware );
};

var app = ElasticMapper.server( _.extend( config, {
  prepareApp: prepareApp,
  prepareQuery: InaturalistMapserver.prepareQuery,
  prepareStyle: InaturalistMapserver.prepareStyle,
  beforeSendResult: InaturalistMapserver.beforeSendResult
}));

// log request times. Doing this outside prepareApp since
// elasticmaps will log its own requests, if config.debug = true
app.use( util.timingMiddleware );

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
