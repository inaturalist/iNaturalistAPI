const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const IdentificationsController = require( "../../../../lib/controllers/v2/identifications_controller" );

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
            $ref: "#/components/schemas/IdentificationsUpdate"
          }
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
