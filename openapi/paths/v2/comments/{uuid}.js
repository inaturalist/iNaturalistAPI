const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const CommentsController = require( "../../../../lib/controllers/v2/comments_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await CommentsController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["Comments"],
    summary: "Update a comment",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.string( ).guid( )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID" )
      )
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/CommentsUpdate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of comments",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsComments"
            }
          }
        }
      }
    }
  };

  async function DELETE( req, res ) {
    await CommentsController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["Comments"],
    summary: "Delete a comment",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.string( ).guid( )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID" )
      )
    ],
    responses: {
      200: {
        description: "No response body; success implies deletion"
      }
    }
  };

  return {
    PUT,
    DELETE
  };
};
