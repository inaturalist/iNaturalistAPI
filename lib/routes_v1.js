var _ = require( "underscore" ),
    YAML = require( "yamljs" ),
    ejs = require( "ejs" ),
    InaturalistAPI = require( "./inaturalist_api" ),
    util = require( "./util" ),
    routesV1 = { };

routesV1.docs = function( req, res ) {
  res.redirect( "/v1/docs" );
};

routesV1.swaggerRedirect = function( req, res ) {
  res.redirect( "/v1/swagger.json" );
};

routesV1.swaggerJSON = function( req, res ) {
  req.query.ttl = req.query.ttl || 3600;
  // using EJS to do includes in the YML file since in YML you cannot
  // extend arrays, and Swagger has no syntax for it either
  ejs.renderFile( "lib/views/swagger_v1.yml.ejs", { }, function( err, data ) {
    if( err ) { return util.renderJSONPresponse( req, res, err ); }
    var yml = ejs.render( data );
    // turn the YML into JSON for proper Swagger validation
    var swaggerJSON = YAML.parse( yml );
    util.renderJSONPresponse( req, res, null, swaggerJSON );
  });
};

routesV1.observations_index = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  InaturalistAPI.observationsIndex( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.observations_identifiers = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  InaturalistAPI.observationsIdentifiers( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.observations_observers = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  InaturalistAPI.observationsObservers( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.species_counts = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  InaturalistAPI.leafTaxaCounts( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.observations_show = function( req, res ) {
  var err = InaturalistAPI.methodValidationError( req );
  if( err ) { return util.renderError( err, res ); }
  var params = { query: _.extend( { }, { id: req.params.id }, req.query ) };
  InaturalistAPI.observationsIndex( params, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.taxa_autocomplete = function( req, res ) {
  req.query.ttl = req.query.ttl || 120;
  InaturalistAPI.taxaAutocomplete( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.taxa_show = function( req, res ) {
  var err = InaturalistAPI.methodValidationError( req );
  if( err ) { return util.renderError( err, res ); }
  var ids = _.filter( req.params.id.split(","), _.identity );
  var filters = [{ terms: { id: ids } }];
  InaturalistAPI.taxaSearchQuery( req, null, filters, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.places_nearby = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  InaturalistAPI.placesNearby( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.places_show = function( req, res ) {
  var err = InaturalistAPI.methodValidationError( req );
  if( err ) { return util.renderError( err, res ); }
  InaturalistAPI.placesShow( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

module.exports = routesV1;
