const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ObservationsController.show( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observations",
    security: [{
      userJwtOptional: []
    }],
    "x-default-ttl": -1,
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ).guid( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID or a comma-separated list of them" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of observations.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservations"
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  async function PUT( req, res ) {
    const results = await ObservationsController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["Observations"],
    summary: "Update an observation.",
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
        "multipart/form-data": {
          schema: {
            $ref: "#/components/schemas/ObservationsUpdate"
          }
        },
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ObservationsUpdate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of observations.",
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
    await ObservationsController.delete( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["Observations"],
    summary: "Delete an observation",
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
    GET,
    PUT,
    DELETE
  };
};
