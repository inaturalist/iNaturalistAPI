const TaxonNamePrioritiesController = require( "../../../lib/controllers/v2/taxon_name_priorities_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await TaxonNamePrioritiesController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["TaxonNamePriorities"],
    summary: "Create a taxon name priority",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/TaxonNamePrioritiesCreate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "The taxon name priority just created",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxonNamePriorities"
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
