const UsersController = require( "../../../../lib/controllers/v1/users_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    await UsersController.resendConfirmation( req );
    sendWrapper( req, res, null, null );
  }

  POST.apiDoc = {
    tags: ["Users"],
    summary: "Resend an email confirmation",
    security: [{
      userJwtRequired: []
    }],
    responses: {
      200: {
        description: "No response body; success implies creation"
      }
    }
  };

  return {
    POST
  };
};
