const ObservationSoundsController = require( "../../../../lib/controllers/v2/observation_sounds_controller" );

module.exports = sendWrapper => {
  async function DELETE( req, res ) {
    await ObservationSoundsController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["ObservationSounds"],
    summary: "Delete an observation sound",
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
    DELETE
  };
};
