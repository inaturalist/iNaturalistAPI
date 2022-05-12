const Joi = require( "joi" );
const transform = require( "../../joi_to_openapi_parameter" );
const authorizedApplicationsController = require(
  "../../../lib/controllers/v1/authorized_applications_controller"
);

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await authorizedApplicationsController.index( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["AuthorizedApplications"],
    summary: "Return applications the authenticated user has authorized to access their account",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) ),
      transform( Joi.string( ).label( "fields" ) )
    ],
    responses: {
      200: {
        description: "A list of authorized applications",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsAuthorizedApplications"
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
