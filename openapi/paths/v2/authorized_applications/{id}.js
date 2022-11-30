const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const authorizedApplicationsController = require(
  "../../../../lib/controllers/v1/authorized_applications_controller"
);

module.exports = sendWrapper => {
  async function DELETE( req, res ) {
    await authorizedApplicationsController.delete( req );
    sendWrapper( req, res.status( 204 ) );
  }

  DELETE.apiDoc = {
    tags: ["AuthorizedApplications"],
    summary: "Revoke application authorization",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "Unique identifier for the authorization" )
      )
    ],
    responses: {
      204: {
        description: "Authorization revoked"
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  return {
    DELETE
  };
};
