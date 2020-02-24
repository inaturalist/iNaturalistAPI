const Joi = require( "@hapi/joi" );
const j2s = require( "hapi-joi-to-swagger" );
const usersUpdateSchema = require( "../../../schema/request/users_update_multipart" );
const transform = require( "../../../joi_to_openapi_parameter" );
const UsersController = require( "../../../../lib/controllers/v1/users_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await UsersController.show( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Users"],
    summary: "Fetch users.",
    security: [{
      jwtOptional: []
    }],
    parameters: [
      transform( Joi.string( ).label( "id" ).meta( { in: "path" } )
        .required( ) )
    ],
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

  async function POST( req, res ) {
    UsersController.update( req, ( err, results ) => {
      sendWrapper( req, res, err, results );
    } );
  }

  POST.apiDoc = {
    tags: ["Users"],
    summary: "Update users.",
    security: [{
      jwtRequired: []
    }],
    parameters: [
      transform( Joi.string( ).label( "id" ).meta( { in: "path" } )
        .required( ) )
    ],
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: j2s( usersUpdateSchema ).swagger
        },
        "application/json": {
          schema: {
            $ref: "#/components/schemas/UsersUpdate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of users.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/User"
            }
          }
        }
      }
    }
  };

  return {
    GET,
    POST
  };
};
