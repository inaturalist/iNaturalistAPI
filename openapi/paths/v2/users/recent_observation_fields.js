const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const UsersController = require( "../../../../lib/controllers/v1/users_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await UsersController.recentObservationFields( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Users"],
    summary: "Fetch observation fields recently used by the logged-in user.",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform( Joi.string( ).label( "fields" ) )
    ],
    responses: {
      200: {
        description: "An array of observation fields.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationFields"
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
