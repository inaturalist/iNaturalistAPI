const Joi = require( "@hapi/joi" );
const transform = require( "../../joi_to_openapi_parameter" );
const ControlledTermsController = require( "../../../lib/controllers/v2/controlled_terms_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ControlledTermsController.search( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Controlled Terms"],
    summary: "Search controlled terms",
    security: [{
      jwtOptional: []
    }],
    parameters: [
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "A list of all controlled terms",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsControlledTerms"
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
