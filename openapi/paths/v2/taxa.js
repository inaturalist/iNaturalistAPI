const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../joi_to_openapi_parameter" );
const taxaController = require( "../../../lib/controllers/v2/taxa_controller" );
const taxaSearchSchema = require( "../../schema/request/taxa_search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await taxaController.search( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    taxaSearchSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Taxa"],
    summary: "Search taxa",
    parameters,
    "x-default-ttl": 300,
    responses: {
      200: {
        description: "An array of taxa",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxa"
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
