const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const TaxonNamePrioritiesController = require( "../../../../lib/controllers/v2/taxon_name_priorities_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await TaxonNamePrioritiesController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["TaxonNamePriorities"],
    summary: "Update a taxon name priority",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single ID" )
      )
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/TaxonNamePrioritiesUpdate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of taxon name priorities",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxonNamePriorities"
            }
          }
        }
      }
    }
  };

  async function DELETE( req, res ) {
    await TaxonNamePrioritiesController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["TaxonNamePriorities"],
    summary: "Delete a taxon name priority",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single ID" )
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
