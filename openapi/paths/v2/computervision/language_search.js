const _ = require( "lodash" );
const languageSearchSchema = require( "../../../schema/request/language_search" );
const transform = require( "../../../joi_to_openapi_parameter" );
const computervisionController = require( "../../../../lib/controllers/v1/computervision_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await computervisionController.languageSearch( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Computer Vision"],
    summary: "Fetch language demo search results for a search term",
    security: [{
      appOrUserJwtRequired: []
    }],
    "x-unpublished": true,
    parameters: _.map(
      languageSearchSchema.$_terms.keys, child => (
        transform( child.schema.label( child.key ) )
      )
    ),
    responses: {
      200: {
        description: "An array of language demo search results",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsLanguageSearch"
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
