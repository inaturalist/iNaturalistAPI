const _ = require( "lodash" );
const transform = require( "../../joi_to_openapi_parameter" );
const SearchController = require( "../../../lib/controllers/v1/search_controller" );
const searchSchema = require( "../../schema/request/search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await SearchController.search( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Search"],
    summary: "Given zero to many of following parameters, returns object matching the search criteria",
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
        description: "A array of results",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsSearch"
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
