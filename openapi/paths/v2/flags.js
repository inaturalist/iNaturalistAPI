const FlagsController = require( "../../../lib/controllers/v2/flags_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await FlagsController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["Flags"],
    summary: "Create a flag",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/FlagsCreate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of flags",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsFlags"
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  return {
    POST
  };
};
