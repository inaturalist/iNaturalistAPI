const _ = require( "lodash" );
const Joi = require( "@hapi/joi" );
const observationsSearchSchema = require( "../../../schema/request/observations_search" );
const transform = require( "../../../joi_to_openapi_parameter" );
const observationsController = require( "../../../../lib/controllers/v1/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    req.params.id = req.params.id.join( "," );
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
      transform( Joi.array( ).items( Joi.number( ).integer( ) ).label( "id" ).meta( { in: "path" } )
        .required( ) )
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
