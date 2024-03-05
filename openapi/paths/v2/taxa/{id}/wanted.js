const _ = require( "lodash" );
const Joi = require( "joi" );
const taxaWantedSchema = require( "../../../../schema/request/taxa_wanted" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const TaxaController = require( "../../../../../lib/controllers/v2/taxa_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TaxaController.wanted( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    taxaWantedSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform(
      Joi.number( ).integer( )
        .label( "id" )
        .meta( { in: "path" } )
        .required( )
        .description( "A single ID" )
    ),
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Taxa"],
    summary: "Fetch unobserved taxa in a clade.",
    security: [{
      userJwtOptional: []
    }],
    parameters,
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
