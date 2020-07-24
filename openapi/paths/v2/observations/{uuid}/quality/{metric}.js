const Joi = require( "@hapi/joi" );
const transform = require( "../../../../../joi_to_openapi_parameter" );
const ObservationsController = require( "../../../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    await ObservationsController.setQualityMetric( req );
    sendWrapper( req, res.status( 204 ) );
  }

  POST.apiDoc = {
    tags: ["Observations"],
    summary: "Vote on an observation quality metric",
    security: [{
      jwtRequired: []
    }],
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ).guid( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID" )
      ),
      transform(
        Joi.string( )
          .label( "metric" )
          .required( )
          .description( "The metric being voted on" )
          .meta( { in: "path" } )
          .valid(
            "date",
            "evidence",
            "location",
            "needs_id",
            "recent",
            "wild"
          )
      ),
      transform( Joi.boolean( ).label( "agree" ).meta( { in: "query" } ) )
    ],
    responses: {
      204: {
        description: "Vote was successful"
      }
    }
  };

  async function DELETE( req, res ) {
    await ObservationsController.deleteQualityMetric( req );
    sendWrapper( req, res.status( 204 ) );
  }

  DELETE.apiDoc = {
    tags: ["Observations"],
    summary: "Remove the authenticated user's vote on a quality metric",
    security: [{
      jwtRequired: []
    }],
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ).guid( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID" )
      ),
      transform(
        Joi.string( )
          .label( "metric" )
          .required( )
          .description( "The metric being voted on" )
          .meta( { in: "path" } )
          .valid(
            "date",
            "evidence",
            "location",
            "needs_id",
            "recent",
            "wild"
          )
      )
    ],
    responses: {
      204: {
        description: "Vote removal was successful"
      }
    }
  };

  return { POST, DELETE };
};
