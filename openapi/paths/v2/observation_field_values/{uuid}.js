const observationFieldsController = require( "../../../../lib/controllers/v2/observation_field_values_controller" );

module.exports = sendWrapper => {
  async function DELETE( req, res ) {
    await observationFieldsController.delete( req );
    sendWrapper( req, res.status( 204 ) );
  }

  DELETE.apiDoc = {
    tags: ["ObservationFieldValues"],
    summary: "Delete an observation field value",
    security: [{
      userJwtRequired: []
    }],
    responses: {
      204: {
        description: "Observation field value deleted"
      }
    }
  };

  return {
    DELETE
  };
};
