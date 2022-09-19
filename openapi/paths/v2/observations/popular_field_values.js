const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );
const observationsPopularFieldValuesSchema = require( "../../../schema/request/observations_popular_field_values" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.popularFieldValues( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    observationsPopularFieldValuesSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observation controlled terms values and a monthly histogram",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "An array of observation counts over time.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsPopularFieldValues"
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
