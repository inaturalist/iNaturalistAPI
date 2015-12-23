var _ = require( "underscore" ),
    InaturalistAPI = require( "./inaturalist_api" ),
    util = require( "./util" ),
    routes = { };

routes.index = function( req, res ) {
  res.send( "iNaturalist API" ).end( );
};

routes.observations_index = function( req, res ) {
  InaturalistAPI.observationsIndex( req, function( err, data ) {
    if( err ) { return util.renderError( err, res ); }
    res.jsonp( data );
  });
};

routes.observations_identifiers = function( req, res ) {
  InaturalistAPI.observationsIdentifiers( req, function( err, data ) {
    if( err ) { return util.renderError( err, res ); }
    res.setHeader( "Cache-Control", "public, max-age=300" ); // 5 minutes
    res.jsonp( data );
  });
};

routes.observations_observers = function( req, res ) {
  InaturalistAPI.observationsObservers( req, function( err, data ) {
    if( err ) { return util.renderError( err, res ); }
    res.setHeader( "Cache-Control", "public, max-age=300" ); // 5 minutes
    res.jsonp( data );
  });
};

routes.species_counts = function( req, res ) {
  InaturalistAPI.leafTaxaCounts( req, function( err, data ) {
    if( err ) { return util.renderError( err, res ); }
    res.setHeader( "Cache-Control", "public, max-age=300" ); // 5 minutes
    res.jsonp( data );
  });
};

routes.observations_show = function( req, res ) {
  InaturalistAPI.observationsIndex( { query: { id: req.params.id } }, function( err, data ) {
    if( err ) { return util.renderError( err, res ); }
    res.jsonp( data );
  });
};

routes.taxa_autocomplete = function( req, res ) {
  InaturalistAPI.taxaAutocomplete( req, function( err, data ) {
    if( err ) { return util.renderError( err, res ); }
    res.setHeader( "Cache-Control", "public, max-age=120" ); // 2 minutes
    res.jsonp( data );
  });
};

routes.taxa_show = function( req, res ) {
  InaturalistAPI.taxaSearchQuery( req, null, [{ term: { id: req.params.id } }], function( err, data ) {
    if( err ) { return util.renderError( err, res ); }
    res.jsonp( data );
  });
};

routes.places_nearby = function( req, res ) {
  InaturalistAPI.placesNearby( req, function( err, data ) {
    if( err ) { return util.renderError( err, res ); }
    res.jsonp( data );
  });
};

routes.places_show = function( req, res ) {
  InaturalistAPI.placesShow( req, function( err, data ) {
    if( err ) { return util.renderError( err, res ); }
    res.jsonp( data );
  });
};

module.exports = routes;
