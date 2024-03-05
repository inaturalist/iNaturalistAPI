const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const observationFieldValuesController = require( "../../../../lib/controllers/v2/observation_field_values_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await observationFieldValuesController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["ObservationFieldValues"],
    summary: "Update an observation field value",
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
            $ref: "#/components/schemas/ObservationFieldValuesCreate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of observation field values",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationFieldValues"
            }
          }
        }
      }
    }
  };

  async function DELETE( req, res ) {
    await observationFieldValuesController.delete( req );
    sendWrapper( req, res.status( 204 ) );
  }

  DELETE.apiDoc = {
    tags: ["ObservationFieldValues"],
    summary: "Delete an observation field value",
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
      204: {
        description: "Observation field value deleted"
      }
    }
  };

  return {
    PUT,
    DELETE
  };
};
