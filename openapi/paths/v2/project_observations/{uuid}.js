const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const ProjectObservationsController = require( "../../../../lib/controllers/v2/project_observations_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await ProjectObservationsController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["ProjectObservations"],
    summary: "Update a project observation",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.string( ).guid( )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID" )
      )
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ProjectObservationsUpdate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of project observations",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsProjectObservations"
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  async function DELETE( req, res ) {
    await ProjectObservationsController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["ProjectObservations"],
    summary: "Delete a project observation",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.string( ).guid( )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID" )
      )
    ],
    responses: {
      200: {
        description: "No response body; success implies deletion"
      }
    }
  };

  return {
    PUT,
    DELETE
  };
};
