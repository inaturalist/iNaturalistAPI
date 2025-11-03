const Joi = require( "joi" );
const transform = require( "../../../../../../joi_to_openapi_parameter" );
const IdSummaryQualityMetricsController = require(
  "../../../../../../../lib/controllers/v2/id_summary_quality_metrics_controller"
);

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await IdSummaryQualityMetricsController.summaryQualityMetrics( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["TaxonIdSummaries"],
    summary: "Fetch quality metrics for an ID summary",
    "x-unpublished": true,
    security: [{
      userJwtOptional: []
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
      )
    ],
    responses: {
      200: {
        description: "An array of quality metrics",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsQualityMetrics"
            }
          }
        }
      }
    }
  };

  return { GET };
};
