const Joi = require( "@hapi/joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const observationsController = require( "../../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await observationsController.taxonSummary( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Additional information about an observation's taxon",
    description: "Shows additional information about an observation's "
      + "taxon given the observation's coordinates, including relevant a "
      + "conservation status and establishment means",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      transform(
        Joi.string( ).guid( )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single observation UUID" )
      ),
      transform(
        Joi.boolean( )
          .label( "community" )
          .description( "Show info about the community taxon instead of the observation taxon" )
          .meta( { in: "query" } )
      )
    ],
    responses: {
      200: {
        description: "An array of quality metrics",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxonSummary"
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
