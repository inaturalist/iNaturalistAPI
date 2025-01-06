const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const projectsController = require( "../../../../../lib/controllers/v1/projects_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    await projectsController.feature( req );
    sendWrapper( req, res.status( 204 ) );
  }

  PUT.apiDoc = {
    tags: ["Projects"],
    summary: "Set a project as featured",
    security: [{
      userJwtRequired: []
    }],
    "x-unpublished": true,
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single project ID" )
      )
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ProjectsFeature"
          }
        }
      }
    },
    responses: {
      204: {
        description: "Project featured"
      }
    }
  };

  return {
    PUT
  };
};
