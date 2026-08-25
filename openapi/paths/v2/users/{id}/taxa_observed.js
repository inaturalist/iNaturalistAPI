const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const UsersController = require( "../../../../../lib/controllers/v2/users_controller" );
const observationsSearchSchema = require( "../../../../schema/request/observations_search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await UsersController.taxaObserved( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.filter( _.map(
    observationsSearchSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  ), p => !_.includes( ["order_by", "only_id"], p.name ) );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Users"],
    summary: "Fetch taxa observed by a user",
    security: [{
      userJwtOptional: []
    }],
    "x-default-ttl": 300,
    "x-unpublished": true,
    parameters,
    responses: {
      200: {
        description: "An array of taxa with counts and observed dates.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsUsersTaxaObserved"
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
