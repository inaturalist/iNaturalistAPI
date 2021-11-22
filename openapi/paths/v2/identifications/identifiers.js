const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const IdentificationsController = require( "../../../../lib/controllers/v2/identifications_controller" );
const identificationsSearchSchema = require( "../../../schema/request/identifications_search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await IdentificationsController.identifiers( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    identificationsSearchSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );
  GET.apiDoc = {
    tags: ["Identifications"],
    summary: "Fetch people who have added the most identifications",
    parameters,
    responses: {
      200: {
        description: "A list of users and the number of identifications they've added that match the query",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsIdentifiers"
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
