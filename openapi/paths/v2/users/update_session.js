const _ = require( "lodash" );
const usersUpdateSessionSchema = require( "../../../schema/request/users_update_session" );
const transform = require( "../../../joi_to_openapi_parameter" );
const UsersController = require( "../../../../lib/controllers/v2/users_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await UsersController.updateSession( req );
    sendWrapper( req, res.status( 204 ), null, results );
  }

  PUT.apiDoc = {
    tags: ["Users"],
    summary: "Update session",
    description: `
      Updates attributes that persist for the duration of a user's session.
      Generally only relevant when using the iNaturalist website
    `,
    security: [{
      jwtRequired: []
    }],
    parameters: _.map( usersUpdateSessionSchema._inner.children, child => (
      transform( child.schema.label( child.key ) )
    ) ),
    responses: {
      204: {
        description: "Session updatedv"
      }
    }
  };

  return {
    PUT
  };
};
