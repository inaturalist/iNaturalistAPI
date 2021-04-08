const Joi = require( "@hapi/joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await ObservationsController.vote( req );
    sendWrapper( req, res.status( 204 ), null, results );
  }

  POST.apiDoc = {
    tags: ["Observations"],
    summary: "Vote on an observation",
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
          .description( "A single UUID" )
      )
    ],
    responses: {
      204: {
        description: "Vote was successful"
      }
    }
  };

  async function DELETE( req, res ) {
    const results = await ObservationsController.unvote( req );
    sendWrapper( req, res.status( 204 ), null, results );
  }

  DELETE.apiDoc = {
    tags: ["Observations"],
    summary: "Remove the authenticated user's vote on an observation",
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
          .description( "A single UUID" )
      )
    ],
    responses: {
      204: {
        description: "Vote removal was successful"
      }
    }
  };

  return { POST, DELETE };
};
