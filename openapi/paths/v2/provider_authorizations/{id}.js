const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const providerAuthorizationsController = require(
  "../../../../lib/controllers/v1/provider_authorizations_controller"
);

module.exports = sendWrapper => {
  async function DELETE( req, res ) {
    await providerAuthorizationsController.delete( req );
    sendWrapper( req, res.status( 204 ) );
  }

  DELETE.apiDoc = {
    tags: ["ProviderAuthorizations"],
    summary: "Revoke iNat's authorization to access the user's account on this provider's service",
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
