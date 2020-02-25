const _ = require( "lodash" );
const taxaAutocompleteSchema = require( "../../../schema/request/taxa_autocomplete" );
const transform = require( "../../../joi_to_openapi_parameter" );
const TaxaController = require( "../../../../lib/controllers/v1/taxa_controller" );


module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TaxaController.autocomplete( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Taxa"],
    summary: "Search taxa.",
    security: [{
      jwtOptional: []
    }],
    parameters: _.map( taxaAutocompleteSchema._inner.children, child => (
      transform( child.schema.label( child.key ) )
    ) ),
    responses: {
      200: {
        description: "An array of taxa.",
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
