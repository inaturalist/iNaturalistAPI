const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );
const observationsUpdatesSchema = require( "../../../schema/request/observations_updates" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.updates( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    observationsUpdatesSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observation updates",
    security: [{
      userJwtRequired: []
    }],
    parameters,
    responses: {
      200: {
        description: "An array of updates.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsUpdates"
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
