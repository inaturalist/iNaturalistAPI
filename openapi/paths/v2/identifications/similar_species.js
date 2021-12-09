const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const IdentificationsController = require( "../../../../lib/controllers/v2/identifications_controller" );
const identificationsSearchSchema = require( "../../../schema/request/identifications_similar_species" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await IdentificationsController.similarSpecies( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    identificationsSearchSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );
  GET.apiDoc = {
    tags: ["Identifications"],
    summary: "Similar Species",
    parameters,
    responses: {
      200: {
        description: "Returns species attached to IDs of observations of this taxon, or attached "
          + "to observations identified as this species, ordered by combined frequency descending. "
          + "This will only return species in the same iconic taxon, and will never return "
          + "descendants of the chosen taxon",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxaCounts"
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
