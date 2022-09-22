const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );
const observationsSearchSchema = require( "../../../schema/request/observations_search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.iconicTaxaSpeciesCounts( req );
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
    summary: "Fetch observation iconic taxon species counts",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "An array of iconic taxon species counts.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsSpeciesCounts"
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
