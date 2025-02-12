const UsersController = require( "../../../../lib/controllers/v2/users_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await UsersController.emailAvailable( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Users"],
    summary: "Check if email is available for account creation",
    security: [{
      appJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/UsersEmailAvailable"
          }
        }
      }
    },
    responses: {
      200: {
        description: "Whether or not the email is available",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsEmailAvailable"
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
    GET
  };
};
