const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );
const observationsSearchSchema = require( "../../../schema/request/observations_search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.speciesCounts( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.filter( _.map(
    observationsSearchSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  ), p => !_.includes( ["order_by", "only_id"], p.name ) );
  parameters.push(
    transform( Joi.boolean( ).default( false ).label( "include_ancestors" ).meta( { in: "query" } ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observation species counts",
    security: [{
      userJwtOptional: []
    }],
    "x-default-ttl": 300,
    parameters,
    responses: {
      200: {
        description: "An array of species counts.",
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
