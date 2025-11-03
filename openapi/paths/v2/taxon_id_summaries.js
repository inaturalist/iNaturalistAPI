const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../joi_to_openapi_parameter" );
const TaxonIdSummariesController = require( "../../../lib/controllers/v2/taxon_id_summaries_controller" );
const taxonIdSummariesSearchSchema = require( "../../schema/request/taxon_id_summaries_search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TaxonIdSummariesController.search( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    taxonIdSummariesSearchSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["TaxonIdSummaries"],
    summary: "Search taxon ID summaries",
    "x-unpublished": true,
    parameters,
    "x-default-ttl": 300,
    responses: {
      200: {
        description: "An array of taxon ID summaries",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxonIdSummaries"
            }
          }
        }
      }
    }
  };

  return {
    GET
  };
};
