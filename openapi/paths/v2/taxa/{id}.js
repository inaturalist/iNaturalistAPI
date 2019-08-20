const _ = require( "lodash" );
const Joi = require( "@hapi/joi" );
const taxaAutocompleteSchema = require( "../../../schema/request/taxa_autocomplete" );
const transform = require( "../../../joi_to_openapi_parameter" );
const TaxaController = require( "../../../../lib/controllers/v1/taxa_controller" );


module.exports = sendWrapper => {
  async function GET( req, res ) {
    TaxaController.show( req, ( err, results ) => {
      sendWrapper( req, res, err, results );
    } );
  }

  GET.apiDoc = {
    tags: ["Taxa"],
    summary: "Fetch taxa.",
    security: [{
      jwtOptional: []
    }],
    parameters: [
      transform( Joi.array( ).items( Joi.number( ).integer( ) ).label( "id" ).meta( { in: "path" } )
        .required( ) )
    ].concat( _.map( taxaAutocompleteSchema._inner.children, child => (
      transform( child.schema.label( child.key ) )
    ) ) ),
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
