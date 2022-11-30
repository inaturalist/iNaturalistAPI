const RelationshipsController = require( "../../../../lib/controllers/v2/relationships_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await RelationshipsController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["Relationships"],
    summary: "Update a relationship",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/RelationshipsUpdate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of relationships",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsRelationships"
            }
          }
        }
      }
    }
  };

  async function DELETE( req, res ) {
    await RelationshipsController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["Relationships"],
    summary: "Delete a relationship",
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
