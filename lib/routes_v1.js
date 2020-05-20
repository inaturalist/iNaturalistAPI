const YAML = require( "yamljs" );
const ejs = require( "ejs" );
const util = require( "./util" );

const routesV1 = { };

routesV1.default = ( method, req, res ) => {
  try {
    method( req, ( err, data ) => {
      util.renderJSONPresponse( req, res, err, data );
    } );
  } catch ( e ) {
    // util.debug( e.stack );
    util.renderJSONPresponse( req, res, "Unexpected error" );
  }
};

routesV1.defaultAsync = async ( method, req, res ) => {
  try {
    const data = await method( req );
    util.renderJSONPresponse( req, res, null, data );
  } catch ( err ) {
    // util.debug( err.stack );
    util.renderJSONPresponse( req, res, err );
  }
};

routesV1.docs = ( req, res ) => {
  res.redirect( "/v1/docs" );
};

routesV1.swaggerRedirect = ( req, res ) => {
  res.redirect( "/v1/swagger.json" );
};

routesV1.swaggerJSON = ( req, res ) => {
  req.query.ttl = req.query.ttl || 3600;
  // using EJS to do includes in the YML file since in YML you cannot
  // extend arrays, and Swagger has no syntax for it either
  ejs.renderFile( "lib/views/swagger_v1.yml.ejs", { }, ( err, data ) => {
    if ( err ) { return void util.renderJSONPresponse( req, res, err ); }
    const yml = ejs.render( data );
    // turn the YML into JSON for proper Swagger validation
    const swaggerJSON = YAML.parse( yml );
    util.renderJSONPresponse( req, res, null, swaggerJSON );
  } );
};

routesV1.robots = ( req, res ) => {
  res.type( "text/plain" );
  res.send( "User-agent: *\nAllow: /v1/docs\nDisallow: /" );
};

module.exports = routesV1;
