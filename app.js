var ElasticMapper = require( "elasticmaps" ),
    InaturalistMapserver = require( "./lib/inaturalist_map_server" ),
    _ = require( "underscore" ),
    config = require( "./config" );

var server = ElasticMapper.server( _.extend( config, {
  beforePrepareQuery: InaturalistMapserver.beforePrepareQuery,
  prepareQuery: InaturalistMapserver.prepareQuery,
  prepareStyle: InaturalistMapserver.prepareStyle
}));

var port = Number( process.env.PORT || 4000 );
server.listen( port, function( ) {
  console.log( "Listening on " + port );
});
