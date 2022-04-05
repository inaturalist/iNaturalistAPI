const sitesController = require( "../../../lib/controllers/v2/sites_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await sitesController.index( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Sites"],
    summary: "List sites",
    parameters: [
      {
        in: "header",
        name: "X-HTTP-Method-Override",
        schema: {
          type: "string"
        }
      }
    ],
    responses: {
      200: {
        description: "A list of sites",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsSites"
            }
          }
        }
      }
    }
  };

  return {
    GET
  };
};
