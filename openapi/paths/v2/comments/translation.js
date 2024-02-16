const CommentsController = require( "../../../../lib/controllers/v2/comments_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    await CommentsController.translateComment( req );
    sendWrapper( req, res.status( 204 ) );
  }

  POST.apiDoc = {
    tags: ["Comments"],
    summary: "Translate a comment",
    security: [{
      appJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/CommentsTranslate"
          }
        }
      }
    },
    responses: {
      204: {
        description: "No response body"
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
