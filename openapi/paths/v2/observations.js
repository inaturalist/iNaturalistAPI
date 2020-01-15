const _ = require( "lodash" );
// We use this to convert Joi schema definitions to swagger/openapi response
// schemas. Joi is a slightly more concise, JS-style of expressing a schema
const j2s = require( "hapi-joi-to-swagger" );
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
      req.query = _.mapValues( req.body, v => v.toString( ) );
    }
    ObservationsController.search( req, ( err, results ) => {
      sendWrapper( req, res, err, results );
    } );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Search observations.",
    security: [{
      jwtOptional: []
    }],
    parameters: _.map( observationsSearchSchema._inner.children, child => (
      transform( child.schema.label( child.key ) )
    ) ),
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
    ObservationsController.show( { params: { id: "1000000" }, query: { } }, ( err, results ) => {
      sendWrapper( req, res, err, results );
    } );
  }

  POST.apiDoc = {
    tags: ["Observations"],
    summary: "Create observations.",
    security: [{
      jwtRequired: []
    }],
    parameters: [{
      in: "header",
      name: "X-HTTP-Method-Override",
      schema: {
        type: "string"
      }
    }],
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: j2s( observationsCreateSchema ).swagger
        },
        "application/json": {
          schema: j2s( observationsSearchSchema ).swagger
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
    POST
  };
};
