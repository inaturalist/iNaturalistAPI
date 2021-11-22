const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const projectsController = require( "../../../../../lib/controllers/v2/projects_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    await projectsController.join( req );
    sendWrapper( req, res.status( 204 ) );
  }

  POST.apiDoc = {
    tags: ["Projects"],
    summary: "Join a project",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single project ID" )
      )
    ],
    responses: {
      204: {
        description: "Joined project"
      }
    }
  };

  async function DELETE( req, res ) {
    await projectsController.leave( req );
    sendWrapper( req, res.status( 204 ) );
  }

  DELETE.apiDoc = {
    tags: ["Projects"],
    summary: "Leave a project",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single project ID" )
      )
    ],
    responses: {
      204: {
        description: "Joined project"
      }
    }
  };

  return {
    POST,
    DELETE
  };
};
