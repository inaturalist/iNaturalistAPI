const _ = require( "lodash" );
const Joi = require( "joi" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );
const observationsDeletedSchema = require( "../../../schema/request/observations_deleted" );
const transform = require( "../../../joi_to_openapi_parameter" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.deleted( req );
    sendWrapper( req, res, null, results );
  }

  const getParameters = _.map(
    observationsDeletedSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    )
  );
  getParameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch IDs of observations deleted by the authenticated user",
    security: [{
      userJwtRequired: []
    }],
    parameters: getParameters,
    responses: {
      200: {
        description: "An array of observation IDs",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsDeleted"
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
