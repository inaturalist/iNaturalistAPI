const Joi = require( "@hapi/joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const observationsController = require( "../../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await observationsController.qualityMetrics( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch quality metrics for observations",
    security: [{
      jwtOptional: []
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
        description: "An array of quality metrics",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsQualityMetrics"
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
