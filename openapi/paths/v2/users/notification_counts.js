const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const UsersController = require( "../../../../lib/controllers/v1/users_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await UsersController.notificationCounts( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Users"],
    summary: "Fetch counts of unread notifications for the logged-in user.",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform( Joi.string( ).label( "fields" ) )
    ],
    responses: {
      200: {
        description: "An object containing counts of unread notifications.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsUsersNotificationCounts"
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
