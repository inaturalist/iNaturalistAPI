const CommentsController = require( "../../../lib/controllers/v2/comments_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await CommentsController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["Comments"],
    summary: "Create a comment",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/CommentsCreate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of comments",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsComments"
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
