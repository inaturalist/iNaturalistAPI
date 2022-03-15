const _ = require( "lodash" );
const usersIndexSchema = require( "../../schema/request/users_index" );
const transform = require( "../../joi_to_openapi_parameter" );
const UsersController = require( "../../../lib/controllers/v2/users_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await UsersController.index( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = [
    {
      in: "header",
      name: "X-HTTP-Method-Override",
      schema: {
        type: "string"
      },
      example: "GET"
    }
  ].concat( _.map( usersIndexSchema.$_terms.keys, child => (
    transform( child.schema.label( child.key ) )
  ) ) );

  GET.apiDoc = {
    tags: ["Users"],
    summary: "List users",
    parameters,
    responses: {
      200: {
        description: "A list of users",
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
