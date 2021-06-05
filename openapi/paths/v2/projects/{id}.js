const Joi = require( "@hapi/joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const projectsController = require( "../../../../lib/controllers/v2/projects_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await projectsController.show( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Projects"],
    summary: "Fetch projects",
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.number( ).integer( ) )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single ID or a comma-separated list of them" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of projects",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsProjects"
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
