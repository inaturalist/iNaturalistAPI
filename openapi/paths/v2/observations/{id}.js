const _ = require( "lodash" );
const Joi = require( "@hapi/joi" );
const observationsSearchSchema = require( "../../../schema/request/observations_search" );
const transform = require( "../../../joi_to_openapi_parameter" );
const observationsController = require( "../../../../lib/controllers/v1/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    observationsController.show( req, ( err, results ) => {
      sendWrapper( res, err, results.results );
    } );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observations.",
    security: [{
      jwtOptional: []
    }],
    parameters: [
      transform( Joi.array( ).items( Joi.number( ).integer( ) ).label( "id" ).meta( { in: "path" } )
        .required( ) )
    ],
    responses: {
      200: {
        description: "An array of observations.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Observation"
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  return {
    GET
  };
};
