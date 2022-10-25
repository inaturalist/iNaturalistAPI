const computervisionController = require( "../../../../lib/controllers/v2/computervision_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await computervisionController.scoreImage( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["Computer Vision"],
    summary: "Fetch computer vision suggestions for an image",
    security: [{
      appOrUserJwtRequired: []
    }],
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: {
            $ref: "#/components/schemas/ComputervisionScoreImage"
          }
        }
      }
    },
    responses: {
      200: {
        description: "An array of suggestions",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsComputervision"
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
