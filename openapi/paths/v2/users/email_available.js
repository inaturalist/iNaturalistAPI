const Joi = require( "joi" );
const usersEmailAvailableSchema = require( "../../../schema/request/users_email_available" );
const transform = require( "../../../joi_to_openapi_parameter" );
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
    parameters: [
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) ),
      transform( Joi.string( ).label( "fields" ) )
    ].concat( usersEmailAvailableSchema.$_terms.keys.map( child => (
      transform( child.schema.label( child.key ) )
    ) ) ),
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
