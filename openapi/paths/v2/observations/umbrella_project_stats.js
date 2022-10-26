const openapiUtil = require( "../../../openapi_util" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.umbrellaProjectStats( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch umbrella project stats",
    security: [{
      userJwtOptional: []
    }],
    parameters: openapiUtil.getParameters( "observations_search" ),
    responses: {
      200: {
        description: "An array of projects with counts.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsUmbrellaProjectStats"
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
