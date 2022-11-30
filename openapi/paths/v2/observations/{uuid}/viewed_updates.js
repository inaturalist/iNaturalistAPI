const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const observationsController = require( "../../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    await observationsController.viewedUpdates( req );
    sendWrapper( req, res.status( 204 ) );
  }

  PUT.apiDoc = {
    tags: ["Observations"],
    summary: "Mark all updates associated with this observation as viewed by logged-in user",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ).guid( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID or a comma-separated list of them" )
      )
    ],
    responses: {
      204: {
        description: "Observation updates marked as viewed"
      }
    }
  };

  return {
    PUT
  };
};
