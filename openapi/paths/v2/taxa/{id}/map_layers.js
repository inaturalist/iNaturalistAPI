const _ = require( "lodash" );
const Joi = require( "joi" );
const taxaWantedSchema = require( "../../../../schema/request/taxa_wanted" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const TaxaController = require( "../../../../../lib/controllers/v2/taxa_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TaxaController.mapLayers( req );
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
    transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Taxa"],
    summary: "Fetch information about which map layers are relevent for a taxon.",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "An array of taxon map layer data.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxaMapLayers"
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
