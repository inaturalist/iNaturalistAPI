const openapiUtil = require( "../../openapi_util" );
const ProjectsController = require( "../../../lib/controllers/v2/projects_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ProjectsController.search( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Projects"],
    summary: "Search projects",
    parameters: openapiUtil.getParameters( "projects_search" ),
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
