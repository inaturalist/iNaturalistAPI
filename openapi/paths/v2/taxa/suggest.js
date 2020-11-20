const _ = require( "lodash" );
// const nodeUtil = require( "util" );
const taxaSuggestSchema = require( "../../../schema/request/taxa_suggest" );
const transform = require( "../../../joi_to_openapi_parameter" );
const TaxaController = require( "../../../../lib/controllers/v2/taxa_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TaxaController.suggest( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = [
    {
      in: "header",
      name: "X-HTTP-Method-Override",
      schema: {
        type: "string"
      }
    }
  ].concat( _.map( taxaSuggestSchema._inner.children, child => (
    transform( child.schema.label( child.key ) )
  ) ) );
  // console.log( "[DEBUG] parameters: ", parameters );
  // console.log( nodeUtil.inspect( parameters, false, null, true ) );

  GET.apiDoc = {
    tags: ["Taxa"],
    summary: "Suggest taxa for identifications given conditions",
    description: "Retrieve automated identification suggestions for an observation or a set of filters like taxon and place",
    security: [{
      userJwtRequired: []
    }],
    parameters,
    responses: {
      200: {
        description: "An array of suggestions",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxaSuggest"
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
