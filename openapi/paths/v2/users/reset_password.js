const UsersController = require( "../../../../lib/controllers/v2/users_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    await UsersController.resetPassword( req );
    sendWrapper( req, res.status( 204 ) );
  }

  POST.apiDoc = {
    tags: ["Users"],
    summary: "Reset a user password",
    security: [{
      appJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/UsersResetPassword"
          }
        }
      }
    },
    responses: {
      204: {
        description: "No response body; success implies reset request was received"
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
