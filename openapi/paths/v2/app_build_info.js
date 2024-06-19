const AppBuildInfoController = require( "../../../lib/controllers/v2/app_build_info_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await AppBuildInfoController.index( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["AppBuildInfo"],
    summary: "Display application build information",
    security: [{
      userJwtRequired: []
    }],
    responses: {
      200: {
        description: "Application build information",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/AppBuildInfo"
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
