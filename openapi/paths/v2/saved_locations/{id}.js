const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const SavedLocationsController = require( "../../../../lib/controllers/v2/saved_locations_controller" );

module.exports = sendWrapper => {
  async function DELETE( req, res ) {
    await SavedLocationsController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["SavedLocations"],
    summary: "Delete a saved location",
    security: [{
      userJwtRequired: []
    }],
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
      200: {
        description: "No response body; success implies deletion"
      }
    }
  };

  return {
    DELETE
  };
};
