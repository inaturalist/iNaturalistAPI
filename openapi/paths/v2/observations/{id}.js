const Joi = require( "@hapi/joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const observationsController = require( "../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    observationsController.show( req, ( err, results ) => {
      sendWrapper( req, res, err, results );
    } );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observations.",
    security: [{
      jwtOptional: []
    }],
    parameters: [
      transform( Joi.array( ).items( Joi.string( ).guid( ) ).label( "id" ).meta( { in: "path" } ) ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) )
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

  return {
    GET
  };
};
