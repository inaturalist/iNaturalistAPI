const Joi = require( "@hapi/joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const computervisionController = require( "../../../../../lib/controllers/v2/computervision_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await computervisionController.scoreObservation( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Computer Vision"],
    summary: "Fetch computer vision suggestions for an observation",
    security: [{
      appOrUserJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.string( ).guid( )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single observation UUID" )
      ),
      transform(
        Joi.string( ).label( "fields" ).meta( { in: "query" } )
          .description( `
Fields are the fields of the nested taxon object in the results, so to specify
fields you will need to post the fields as a JSON object that looks like this:

\`\`\`
{
  fields: {
    taxon: {
      name: true,
      default_photo: {
        url: true
      }
    }
  }
}
\`\`\`
          ` )
      ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of suggestions",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsComputervision"
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
