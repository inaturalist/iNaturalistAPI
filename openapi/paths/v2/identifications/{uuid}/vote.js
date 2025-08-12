const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const IdentificationsController = require( "../../../../../lib/controllers/v2/identifications_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await IdentificationsController.vote( req );
    sendWrapper( req, res.status( 204 ), null, results );
  }

  POST.apiDoc = {
    tags: ["Identifications"],
    summary: "Vote on an identification",
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
    const results = await IdentificationsController.unvote( req );
    sendWrapper( req, res.status( 204 ), null, results );
  }

  DELETE.apiDoc = {
    tags: ["Identifications"],
    summary: "Remove the authenticated user's vote on an identification",
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
