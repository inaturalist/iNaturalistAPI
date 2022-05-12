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
    summary: "Revoke provider authorization",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single ID" )
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
