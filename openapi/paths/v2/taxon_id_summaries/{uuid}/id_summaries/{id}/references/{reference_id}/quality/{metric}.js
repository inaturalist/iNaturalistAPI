const Joi = require( "joi" );
const transform = require( "../../../../../../../../../joi_to_openapi_parameter" );
const IdSummaryQualityMetricsController = require(
  "../../../../../../../../../../lib/controllers/v2/id_summary_quality_metrics_controller"
);

module.exports = sendWrapper => {
  async function POST( req, res ) {
    await IdSummaryQualityMetricsController.setReferenceQualityMetric( req );
    sendWrapper( req, res.status( 204 ) );
  }

  POST.apiDoc = {
    tags: ["TaxonIdSummaries"],
    summary: "Vote on an ID summary reference quality metric",
    "x-unpublished": true,
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.string( )
          .guid( )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "UUID of the parent TaxonIdSummary" )
      ),
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "ID of the child IdSummary" )
      ),
      transform(
        Joi.number( ).integer( )
          .label( "reference_id" )
          .meta( { in: "path" } )
          .required( )
          .description( "ID of the IdSummaryReference" )
      ),
      transform(
        Joi.string( )
          .label( "metric" )
          .meta( { in: "path" } )
          .required( )
          .max( 255 )
          .description( "Metric slug to vote on" )
      ),
      transform(
        Joi.boolean( )
          .label( "agree" )
          .meta( { in: "query" } )
          .description( "Whether the authenticated user agrees with the metric (defaults to true)" )
      )
    ],
    responses: {
      204: { description: "Vote was recorded" }
    }
  };

  async function DELETE( req, res ) {
    await IdSummaryQualityMetricsController.deleteReferenceQualityMetric( req );
    sendWrapper( req, res.status( 204 ) );
  }

  DELETE.apiDoc = {
    tags: ["TaxonIdSummaries"],
    summary: "Remove the authenticated user's vote on an ID summary reference quality metric",
    "x-unpublished": true,
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.string( )
          .guid( )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "UUID of the parent TaxonIdSummary" )
      ),
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "ID of the child IdSummary" )
      ),
      transform(
        Joi.number( ).integer( )
          .label( "reference_id" )
          .meta( { in: "path" } )
          .required( )
          .description( "ID of the IdSummaryReference" )
      ),
      transform(
        Joi.string( )
          .label( "metric" )
          .meta( { in: "path" } )
          .required( )
          .max( 255 )
          .description( "Metric slug to remove" )
      )
    ],
    responses: {
      204: { description: "Vote was removed" }
    }
  };

  return { POST, DELETE };
};
