const Joi = require( "joi" );
const transform = require( "../../joi_to_openapi_parameter" );
const providerAuthorizationsController = require(
  "../../../lib/controllers/v1/provider_authorizations_controller"
);

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await providerAuthorizationsController.index( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["ProviderAuthorizations"],
    summary: "Return authorized provider",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) ),
      transform( Joi.string( ).label( "fields" ) )
    ],
    responses: {
      200: {
        description: "A list of providers",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsProviderAuthorizations"
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
