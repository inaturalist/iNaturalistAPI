const openapiUtil = require( "../../../openapi_util" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.iconicTaxaSpeciesCounts( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observation iconic taxon species counts",
    security: [{
      userJwtOptional: []
    }],
    parameters: openapiUtil.getParameters( "observations_search" ),
    responses: {
      200: {
        description: "An array of iconic taxon species counts.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsSpeciesCounts"
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
