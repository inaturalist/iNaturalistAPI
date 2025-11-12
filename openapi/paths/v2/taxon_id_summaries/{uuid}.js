const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const TaxonIdSummariesController = require( "../../../../lib/controllers/v2/taxon_id_summaries_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TaxonIdSummariesController.show( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["TaxonIdSummaries"],
    summary: "Fetch taxon ID summaries",
    "x-unpublished": true,
    security: [{
      userJwtOptional: []
    }],
    "x-default-ttl": -1,
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ).guid( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID or a comma-separated list of them" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of taxon ID summaries.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxonIdSummaries"
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
