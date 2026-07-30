const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );
const observationsSearchSchema = require( "../../../schema/request/observations_search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.taxonomy( req );
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
    summary: "Fetch taxonomy metadata for matching observations",
    security: [{
      userJwtOptional: []
    }],
    "x-default-ttl": 300,
    "x-unpublished": true,
    parameters,
    responses: {
      200: {
        description: "An array of taxa.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationsTaxonomy"
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
