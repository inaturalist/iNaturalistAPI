const _ = require( "lodash" );
const transform = require( "../../joi_to_openapi_parameter" );
const SearchController = require( "../../../lib/controllers/v2/search_controller" );
const searchSchema = require( "../../schema/request/search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await SearchController.search( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Search"],
    summary: "Search for multiple kinds of records",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      {
        in: "header",
        name: "X-HTTP-Method-Override",
        schema: {
          type: "string"
        }
      }
    ].concat( _.map( searchSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    ) ) ),
    responses: {
      200: {
        description: "An array of search results. The actual record is keyed by its type, "
          + "so if the `result.type` field is `project`, `result.project` will hold the "
          + "project record.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsSearch"
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  return {
    GET
  };
};
