const openapiUtil = require( "../../../openapi_util" );
const IdentificationsController = require( "../../../../lib/controllers/v2/identifications_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await IdentificationsController.identifiers( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Identifications"],
    summary: "Fetch people who have added the most identifications",
    parameters: openapiUtil.getParameters( "identifications_search" ),
    responses: {
      200: {
        description: "A list of users and the number of identifications they've added that match the query",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsIdentifiers"
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
