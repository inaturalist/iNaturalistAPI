var YAML = require( "yamljs" ),
    ejs = require( "ejs" ),
    util = require( "./util" ),
    routesV1 = { };

routesV1.default = function( method, req, res ) {
  try {
    method( req, function( err, data ) {
      util.renderJSONPresponse( req, res, err, data );
    });
  } catch ( e ) {
    util.renderJSONPresponse( req, res, "Unexpected error" );
  }
};

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

routesV1.robots = function( req, res ) {
  res.type( "text/plain" );
  res.send( "User-agent: *\nAllow: /v1/docs\nDisallow: /" );
};

module.exports = routesV1;
