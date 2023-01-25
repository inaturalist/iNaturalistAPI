const ObservationPhotosController = require( "../../../../lib/controllers/v2/observation_photos_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await ObservationPhotosController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["ObservationPhotos"],
    summary: "Update an observation photo",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ObservationPhotosUpdate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of observation photos",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationPhotos"
            }
          }
        }
      }
    }
  };

  async function DELETE( req, res ) {
    await ObservationPhotosController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["ObservationPhotos"],
    summary: "Delete an observation photo",
    security: [{
      userJwtRequired: []
    }],
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
