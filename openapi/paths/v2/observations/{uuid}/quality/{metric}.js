const Joi = require( "joi" );
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
      userJwtRequired: []
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
          .description( `
            The metric being voted on.

            date: Whether or not the date seems accurate.
            evidence: Whether the media presents evidence for the presence of the organism.
            location: Whether the location seems accurate.
            needs_id: Whether the observation should remain in the Needs ID category.
            recent: Whether the evidence demonstrates that the organism was present recently.
            wild: Whether the individual organism was where and when it was without human intervention.
          `.replace( /\s+/m, " " ) )
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
      userJwtRequired: []
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
