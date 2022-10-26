const openapiUtil = require( "../../../openapi_util" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.histogram( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observation histograms",
    security: [{
      userJwtOptional: []
    }],
    parameters: openapiUtil.getParameters( "observations_histogram" ),
    responses: {
      200: {
        description: "An object with observation counts over time.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsHistogram"
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
