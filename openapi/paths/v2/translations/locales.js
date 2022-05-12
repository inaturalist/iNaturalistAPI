const Joi = require( "joi" );
const TranslationsController = require( "../../../../lib/controllers/v2/translations_controller" );
const transform = require( "../../../joi_to_openapi_parameter" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TranslationsController.locales( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Translations"],
    summary: "Return site translated locales",
    parameters: [
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) ),
      transform( Joi.string( ).label( "fields" ).default( "locale,language_in_locale" ) )
    ],
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
