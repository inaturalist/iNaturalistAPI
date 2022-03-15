const j2s = require( "joi-to-swagger" );
const ProjectObservationsController = require( "../../../lib/controllers/v2/project_observations_controller" );
const projectObservationsCreateSchema = require( "../../schema/request/project_observations_create" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await ProjectObservationsController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["ProjectObservations"],
    summary: "Add an observation to a project",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: j2s( projectObservationsCreateSchema ).swagger
        }
      }
    },
    responses: {
      200: {
        description: "The ProjectObservation record just created",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsProjectObservations"
            }
          }
        }
      }
    }
  };

  return {
    POST
  };
};
