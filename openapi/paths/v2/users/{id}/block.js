const UsersController = require( "../../../../../lib/controllers/v2/users_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    await UsersController.block( req );
    sendWrapper( req, res, null, null );
  }

  POST.apiDoc = {
    tags: ["Users"],
    summary: "Block a user",
    security: [{
      userJwtRequired: []
    }],
    responses: {
      200: {
        description: "No response body; success implies creation"
      }
    }
  };

  async function DELETE( req, res ) {
    await UsersController.unblock( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["Users"],
    summary: "Remove a user block",
    security: [{
      userJwtRequired: []
    }],
    responses: {
      200: {
        description: "No response body; success implies deletion"
      }
    }
  };

  return {
    POST,
    DELETE
  };
};
