const openapiUtil = require( "../../../openapi_util" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.observers( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observation observers",
    security: [{
      userJwtOptional: []
    }],
    parameters: openapiUtil.getParameters( "observations_observers" ),
    responses: {
      200: {
        description: "An array of users with counts.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsObservers"
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
