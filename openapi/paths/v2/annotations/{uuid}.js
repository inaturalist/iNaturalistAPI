const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const AnnotationsController = require( "../../../../lib/controllers/v2/annotations_controller" );

module.exports = sendWrapper => {
  async function DELETE( req, res ) {
    await AnnotationsController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["Annotations"],
    summary: "Delete an annotation",
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
      200: {
        description: "No response body; success implies deletion"
      }
    }
  };

  return {
    DELETE
  };
};
