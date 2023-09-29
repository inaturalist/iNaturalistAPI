const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const projectsController = require( "../../../../../lib/controllers/v2/projects_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await projectsController.membership( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Projects"],
    summary: "Membership of current user.",
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
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of project membership details",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsProjectMembership"
            }
          }
        }
      }
    }
  };

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
    GET,
    POST,
    DELETE
  };
};
