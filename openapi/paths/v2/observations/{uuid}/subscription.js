const Joi = require( "@hapi/joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const observationsController = require( "../../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    await observationsController.subscription( req );
    sendWrapper( req, res.status( 204 ) );
  }

  PUT.apiDoc = {
    tags: ["Observations"],
    summary: "Toggle the authenticated user's subscription to an observation",
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
      )
    ],
    responses: {
      204: {
        description: "Subscription toggled"
      }
    }
  };

  return {
    PUT
  };
};
