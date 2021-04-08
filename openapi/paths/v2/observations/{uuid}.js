const Joi = require( "@hapi/joi" );
const j2s = require( "hapi-joi-to-swagger" );
const transform = require( "../../../joi_to_openapi_parameter" );
const observationsCreateSchema = require( "../../../schema/request/observations_create" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    // Attempt to mimic v2 cache headers
    // TODO abstract this in to an easy way for all endpoints to do this
    const ttlString = req.query.ttl || req.body.ttl;
    const ttl = ttlString && Number( ttlString );
    if ( ttl === -1 ) {
      req.query.ttl = Number( ttl );
      res.setHeader( "Cache-Control",
        "private, no-cache, no-store, must-revalidate" );
      res.setHeader( "Expires", "-1" );
      res.setHeader( "Pragma", "no-cache" );
    } else if ( ttl ) {
      req.query.ttl = Number( ttl );
      res.setHeader( "Cache-Control", `public, max-age=${ttl}` );
    }
    const results = await ObservationsController.show( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observations",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ).guid( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID or a comma-separated list of them" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of observations.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservations"
            }
          }
        }
      }
    }
  };

  async function PUT( req, res ) {
    const results = await ObservationsController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["Observations"],
    summary: "Update an observation.",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: j2s( observationsCreateSchema ).swagger
        },
        "application/json": {
          schema: j2s( observationsCreateSchema ).swagger
        }
      }
    },
    responses: {
      200: {
        description: "A list of observations.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservations"
            }
          }
        }
      }
    }
  };

  return {
    GET,
    PUT
  };
};
