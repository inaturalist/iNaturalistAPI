const _ = require( "lodash" );
const TranslationsController = require( "../../../../lib/controllers/v2/translations_controller" );
const translationsLocalesFetch = require( "../../../schema/request/translations_locales" );
const transform = require( "../../../joi_to_openapi_parameter" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TranslationsController.locales( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Sites"],
    summary: "Return site translated locales",
    parameters: [
      {
        in: "header",
        name: "X-HTTP-Method-Override",
        schema: {
          type: "string"
        }
      }
    ].concat( _.map( translationsLocalesFetch.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    ) ) ),
    responses: {
      200: {
        description: "A list of locales",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTranslationsLocales"
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
