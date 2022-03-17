const Joi = require( "joi" );
const j2s = require( "joi-to-swagger" );
const usersUpdateSchema = require( "../../../schema/request/users_update_multipart" );
const transform = require( "../../../joi_to_openapi_parameter" );
const UsersController = require( "../../../../lib/controllers/v2/users_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await UsersController.show( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Users"],
    summary: "Fetch users.",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      transform( Joi.string( ).label( "id" ).meta( { in: "path" } )
        .required( ) ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
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

  async function PUT( req, res ) {
    const results = await UsersController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["Users"],
    summary: "Update users.",
    security: [{
      userJwtRequired: []
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
    PUT
  };
};
