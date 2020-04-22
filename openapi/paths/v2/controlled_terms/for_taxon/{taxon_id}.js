const Joi = require( "@hapi/joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const ControlledTermsController = require( "../../../../../lib/controllers/v2/controlled_terms_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ControlledTermsController.forTaxon( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Controlled Terms"],
    summary: "Fetch controlled terms for a taxon",
    security: [{
      jwtOptional: []
    }],
    parameters: [
      transform(
        Joi.array( )
          // openapi-request-coercer doesn't seem to work if you specify
          // multiple types of items in an array, so here we're coercing
          // everthing into a string and performing any further filtering or
          // coersion (e.g. separating IDs from UUIDs) in the controller
          .items( Joi.string( ) )
          .label( "taxon_id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single taxon UUID or ID, or a comma-separated list of them" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "A list of controlled attributes relevant to a taxon with nested controlled values",
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
