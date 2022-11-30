const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );
const observationsHistogramSchema = require( "../../../schema/request/observations_histogram" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.histogram( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    observationsHistogramSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observation histograms",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "An object with observation counts over time.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsHistogram"
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
