const TaxonNamePreferencesController = require( "../../../lib/controllers/v2/taxon_name_preferences_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await TaxonNamePreferencesController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["TaxonNamePreferences"],
    summary: "Create a taxon name preference",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/TaxonNamePreferencesCreate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "The taxon name preference just created",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxonNamePreferences"
            }
          }
        }
      }
    }
  };

  return {
    POST
  };
};
