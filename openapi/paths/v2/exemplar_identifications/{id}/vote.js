const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const ExemplarIdentificationsController = require( "../../../../../lib/controllers/v2/exemplar_identifications_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await ExemplarIdentificationsController.vote( req );
    sendWrapper( req, res.status( 204 ), null, results );
  }

  POST.apiDoc = {
    tags: ["ExemplarIdentifications"],
    summary: "Vote on an exemplar identification",
    security: [{
      userJwtRequired: []
    }],
    "x-unpublished": true,
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single ID" )
      )
    ],
    responses: {
      204: {
        description: "Vote was successful"
      }
    }
  };

  async function DELETE( req, res ) {
    const results = await ExemplarIdentificationsController.unvote( req );
    sendWrapper( req, res.status( 204 ), null, results );
  }

  DELETE.apiDoc = {
    tags: ["ExemplarIdentifications"],
    summary: "Remove the authenticated user's vote on an exemplar identification",
    security: [{
      userJwtRequired: []
    }],
    "x-unpublished": true,
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single ID" )
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
