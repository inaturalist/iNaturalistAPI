const j2s = require( "joi-to-swagger" );
const IdentificationsController = require( "../../../../lib/controllers/v2/identifications_controller" );
const identificationsUpdateSchema = require( "../../../schema/request/identifications_update" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await IdentificationsController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["Identifications"],
    summary: "Update an identification",
    security: [{
      userJwtOptional: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: j2s( identificationsUpdateSchema ).swagger
        }
      }
    },
    responses: {
      200: {
        description: "An array of identifications.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservations"
            }
          }
        }
      }
    }
  };

  async function DELETE( req, res ) {
    await IdentificationsController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["Identifications"],
    summary: "Delete an identification",
    description: "Note that unlike API v1, this completely deletes the identification. "
      + "To withdraw the identification, update `current` to `false`.",
    security: [{
      userJwtRequired: []
    }],
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
