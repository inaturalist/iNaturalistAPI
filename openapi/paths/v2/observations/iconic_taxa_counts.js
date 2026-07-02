const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );
const observationsSearchSchema = require( "../../../schema/request/observations_search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.iconicTaxaCounts( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    observationsSearchSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observation counts by iconic taxon",
    description: "Given zero to many of same parameters as the observation search API, "
      + "returns observation counts grouped by iconic taxon. Results include an entry "
      + "with a null taxon counting observations without an iconic taxon, equivalent to "
      + "filtering observations with `iconic_taxa=unknown`",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "An array of observation counts by iconic taxon.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsIconicTaxaCounts"
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
