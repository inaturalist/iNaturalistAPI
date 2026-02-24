const _ = require( "lodash" );
const Joi = require( "joi" );
const exemplarIdentificationsSearchSchema = require( "../../schema/request/exemplar_identifications_search" );
// This is a custom method to convert Joi schema definitions to swagger/openapi
// parameter definitions, which are different from the response definitions that
// hapi-join-to-swagger handles
const transform = require( "../../joi_to_openapi_parameter" );
const ExemplarIdentificationsController = require( "../../../lib/controllers/v2/exemplar_identifications_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await ExemplarIdentificationsController.search( req );
    sendWrapper( req, res, null, results );
  }

  const getParameters = _.map(
    exemplarIdentificationsSearchSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    )
  );
  getParameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["ExemplarIdentifications"],
    summary: "Search exemplar identifications",
    security: [{
      userJwtOptional: []
    }],
    "x-unpublished": true,
    parameters: getParameters,
    responses: {
      200: {
        description: "A list of exemplar identifications.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsExemplarIdentifications"
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  return {
    GET
  };
};
