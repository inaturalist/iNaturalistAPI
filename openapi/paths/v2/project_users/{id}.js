const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const ProjectUsersController = require( "../../../../lib/controllers/v1/project_users_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await ProjectUsersController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["ProjectUsers"],
    summary: "Update project users.",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform( Joi.string( ).label( "id" ).meta( { in: "path" } )
        .required( ) )
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ProjectUsersUpdate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A project user.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ProjectUser"
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
    PUT
  };
};
