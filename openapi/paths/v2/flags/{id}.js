const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const FlagsController = require( "../../../../lib/controllers/v2/flags_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await FlagsController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["Flags"],
    summary: "Update a flag",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "ID of the record" )
      )
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/FlagsUpdate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of flags",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsFlags"
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
    await FlagsController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["Flags"],
    summary: "Delete a flag",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "ID of the record" )
      )
    ],
    responses: {
      200: {
        description: "No response body; success implies deletion"
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  return {
    PUT,
    DELETE
  };
};
