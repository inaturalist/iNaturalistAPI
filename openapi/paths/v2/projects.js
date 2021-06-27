const _ = require( "lodash" );
const projectsSearchSchema = require( "../../schema/request/projects_search" );
const transform = require( "../../joi_to_openapi_parameter" );
const ProjectsController = require( "../../../lib/controllers/v2/projects_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    if ( req.originalMethod === "POST" ) {
      req.originalQuery = req.query;
      req.query = _.mapValues( req.body, v => v.toString( ) );
    }
    const results = await ProjectsController.search( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Projects"],
    summary: "Search projects",
    parameters: [
      {
        in: "header",
        name: "X-HTTP-Method-Override",
        schema: {
          type: "string"
        }
      }
    ].concat( _.map( projectsSearchSchema._inner.children, child => (
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
