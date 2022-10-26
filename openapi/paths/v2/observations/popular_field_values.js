const openapiUtil = require( "../../../openapi_util" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.popularFieldValues( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observation controlled terms values and a monthly histogram",
    security: [{
      userJwtOptional: []
    }],
    parameters: openapiUtil.getParameters( "observations_popular_field_values" ),
    responses: {
      200: {
        description: "An array of observation counts over time.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsPopularFieldValues"
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
