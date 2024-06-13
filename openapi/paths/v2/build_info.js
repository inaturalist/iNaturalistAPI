const j2s = require( "joi-to-swagger" );
const BuildInfoController = require( "../../../lib/controllers/v2/build_info_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await BuildInfoController.index( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["BuildInfo"],
    summary: "Display build information",
    responses: {
      200: {
        description: "Build information",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/BuildInfo"
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    },
    "x-unpublished": true
  };

  return {
    GET
  };
};
