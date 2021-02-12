const _ = require( "lodash" );
const usersAutocompleteSchema = require( "../../../schema/request/users_autocomplete" );
const transform = require( "../../../joi_to_openapi_parameter" );
const UsersController = require( "../../../../lib/controllers/v1/users_controller" );


module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await UsersController.autocomplete( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Users"],
    summary: "Search users.",
    security: [{
      userJwtOptional: []
    }],
    parameters: _.map( usersAutocompleteSchema._inner.children, child => (
      transform( child.schema.label( child.key ) )
    ) ),
    responses: {
      200: {
        description: "An array of users.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsUsers"
            }
          }
        }
      }
    }
  };

  return {
    GET
  };
};
