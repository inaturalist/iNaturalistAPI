const CommentsController = require( "../../../../lib/controllers/v2/comments_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const result = await CommentsController.translate( req );
    sendWrapper( req, res, null, result );
  }

  POST.apiDoc = {
    tags: ["Comments"],
    summary: "Translate a comment",
    security: [{
      userJwtRequired: []
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
      200: {
        description: "A translated comment",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsCommentsTranslated"
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
