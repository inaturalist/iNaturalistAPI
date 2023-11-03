const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const TaxaController = require( "../../../../lib/controllers/v2/taxa_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TaxaController.show( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Taxa"],
    summary: "Fetch taxa.",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.number( ).integer( ) )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
      ),
      transform( Joi.array( ).items( Joi.number( ) ).label( "rank_level" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of taxa.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxa"
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
