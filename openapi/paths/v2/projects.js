const _ = require( "lodash" );
const projectsSearchSchema = require( "../../schema/request/projects_search" );
const transform = require( "../../joi_to_openapi_parameter" );
const ProjectsController = require( "../../../lib/controllers/v1/projects_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ProjectsController.search( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Projects"],
    summary: "Search projects",
    "x-default-ttl": 300,
    parameters: [
      {
        in: "header",
        name: "X-HTTP-Method-Override",
        schema: {
          type: "string"
        }
      }
    ].concat( _.map( projectsSearchSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    ) ) ),
    responses: {
      200: {
        description: "A list of projects",
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
