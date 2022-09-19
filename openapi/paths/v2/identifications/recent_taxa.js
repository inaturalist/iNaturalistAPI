const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const IdentificationsController = require( "../../../../lib/controllers/v2/identifications_controller" );
const identificationsRecentTaxaSchema = require( "../../../schema/request/identifications_recent_taxa" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await IdentificationsController.recentTaxa( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    identificationsRecentTaxaSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );
  GET.apiDoc = {
    tags: ["Identifications"],
    summary: "Fetch recent identifications and their associated taxa",
    parameters,
    responses: {
      200: {
        description: "A array of identifications and taxa",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsIdentificationsRecentTaxa"
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
