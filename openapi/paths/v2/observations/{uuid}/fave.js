const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const observationsController = require( "../../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    await observationsController.fave( req );
    sendWrapper( req, res.status( 204 ) );
  }

  POST.apiDoc = {
    tags: ["Observations"],
    summary: "Fave an observation",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ).guid( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID or a comma-separated list of them" )
      )
    ],
    responses: {
      204: {
        description: "Observation faved"
      }
    }
  };

  async function DELETE( req, res ) {
    await observationsController.unfave( req );
    sendWrapper( req, res.status( 204 ) );
  }

  DELETE.apiDoc = {
    tags: ["Observations"],
    summary: "Remove a fave on an observation",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ).guid( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID or a comma-separated list of them" )
      )
    ],
    responses: {
      204: {
        description: "Observation fave removed"
      }
    }
  };

  return {
    POST,
    DELETE
  };
};
