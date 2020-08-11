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
      jwtRequired: []
    }],
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
