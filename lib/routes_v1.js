var YAML = require( "yamljs" ),
    ejs = require( "ejs" ),
    InaturalistAPI = require( "./inaturalist_api" ),
    CommentsController = require( "./controllers/v1/comments_controller" ),
    ObservationsController = require( "./controllers/v1/observations_controller" ),
    PlacesController = require( "./controllers/v1/places_controller" ),
    ProjectsController = require( "./controllers/v1/projects_controller" ),
    TaxaContoller = require( "./controllers/v1/taxa_controller" ),
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
  ObservationsController.search( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.observations_identifiers = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  ObservationsController.identifiers( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.observations_observers = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  ObservationsController.observers( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.species_counts = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  ObservationsController.speciesCounts( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.observations_show = function( req, res ) {
  var err = InaturalistAPI.methodValidationError( req );
  if( err ) { return util.renderError( err, res ); }
  req.query.ttl = req.query.ttl || -1;
  ObservationsController.show( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.taxa_autocomplete = function( req, res ) {
  req.query.ttl = req.query.ttl || 120;
  TaxaContoller.autocomplete( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.taxa_show = function( req, res ) {
  var err = InaturalistAPI.methodValidationError( req );
  if( err ) { return util.renderError( err, res ); }
  TaxaContoller.show( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.places_autocomplete = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  PlacesController.autocomplete( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.places_nearby = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  PlacesController.nearby( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.places_show = function( req, res ) {
  var err = InaturalistAPI.methodValidationError( req );
  if( err ) { return util.renderError( err, res ); }
  PlacesController.show( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.projects_autocomplete = function( req, res ) {
  req.query.ttl = req.query.ttl || 300;
  ProjectsController.autocomplete( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.projects_show = function( req, res ) {
  var err = InaturalistAPI.methodValidationError( req );
  if( err ) { return util.renderError( err, res ); }
  ProjectsController.show( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.comments_create = function( req, res ) {
  CommentsController.create( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.comments_update = function( req, res ) {
  CommentsController.update( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

routesV1.comments_delete = function( req, res ) {
  CommentsController.delete( req, function( err, data ) {
    util.renderJSONPresponse( req, res, err, data );
  });
};

module.exports = routesV1;
