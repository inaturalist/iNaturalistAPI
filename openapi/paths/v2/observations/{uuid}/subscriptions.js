const Joi = require( "@hapi/joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const observationsController = require( "../../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await observationsController.subscriptions( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "List the authenticated user's subscriptions to this observation",
    description: "Includes subscriptions to this specific observation and to "
      + "the user who made this observation. Generally only useful to detect "
      + "whether the authenticated user is subscribed to these records.",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.string( ).guid( )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single observation UUID" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of subscriptions",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsSubscriptions"
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
