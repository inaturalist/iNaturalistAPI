const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const TaxaController = require( "../../../../lib/controllers/v2/taxa_controller" );
const taxonLifelistMetadataSchema = require( "../../../schema/request/taxa_lifelist_metadata" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TaxaController.lifelistMetadata( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    taxonLifelistMetadataSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Taxa"],
    summary: "Fetch taxa metadata related to a users' observations",
    security: [{
      userJwtOptional: []
    }],
    "x-default-ttl": 300,
    parameters,
    responses: {
      200: {
        description: "An array of taxa.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxaLifelistMetadata"
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
