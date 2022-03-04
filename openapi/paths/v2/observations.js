const _ = require( "lodash" );
// We use this to convert Joi schema definitions to swagger/openapi response
// schemas. Joi is a slightly more concise, JS-style of expressing a schema
const j2s = require( "joi-to-swagger" );
const Joi = require( "joi" );
const observationsCreateSchema = require( "../../schema/request/observations_create" );
const observationsSearchSchema = require( "../../schema/request/observations_search" );
// This is a custom method to convert Joi schema definitions to swagger/openapi
// parameter definitions, which are different from the response definitions that
// hapi-join-to-swagger handles
const transform = require( "../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    if ( req.originalMethod === "POST" ) {
      req.originalQuery = req.query;
      req.query = _.mapValues( req.body, v => ( v === null ? null : v.toString( ) ) );
    }
    const results = await ObservationsController.search( req );
    sendWrapper( req, res, null, results );
  }

  const getParameters = _.map(
    observationsSearchSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    )
  );
  getParameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Search observations",
    security: [{
      userJwtOptional: []
    }],
    parameters: getParameters,
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

  async function POST( req, res ) {
    const results = await ObservationsController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["Observations"],
    summary: "Create observations.",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
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
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  return {
    GET,
    POST
  };
};
