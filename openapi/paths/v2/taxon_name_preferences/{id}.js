const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const TaxonNamePreferencesController = require( "../../../../lib/controllers/v2/taxon_name_preferences_controller" );

module.exports = sendWrapper => {
  async function DELETE( req, res ) {
    await TaxonNamePreferencesController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["TaxonNamePreferences"],
    summary: "Delete a taxon name preference",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.number( ).integer( ) )
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
