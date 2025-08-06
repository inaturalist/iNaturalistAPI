const _ = require( "lodash" );
const Joi = require( "joi" );
const taxonIdentificationsSearchSchema = require( "../../schema/request/taxon_identifications_search" );
// This is a custom method to convert Joi schema definitions to swagger/openapi
// parameter definitions, which are different from the response definitions that
// hapi-join-to-swagger handles
const transform = require( "../../joi_to_openapi_parameter" );
const TaxonIdentificationsController = require( "../../../lib/controllers/v2/taxon_identifications_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TaxonIdentificationsController.search( req );
    sendWrapper( req, res, null, results );
  }

  const getParameters = _.map(
    taxonIdentificationsSearchSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    )
  );
  getParameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["TaxonIdentifications"],
    summary: "Search taxon identifications",
    security: [{
      userJwtOptional: []
    }],
    parameters: getParameters,
    responses: {
      200: {
        description: "A list of taxon identifications.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxonIdentifications"
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
