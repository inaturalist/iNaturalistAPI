const Joi = require( "@hapi/joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const AnnotationsController = require( "../../../../../lib/controllers/v2/annotations_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await AnnotationsController.vote( req );
    sendWrapper( req, res.status( 204 ), null, results );
  }

  POST.apiDoc = {
    tags: ["Annotations"],
    summary: "Vote on an annotation",
    security: [{
      jwtRequired: []
    }],
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ).guid( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID" )
      )
    ],
    responses: {
      204: {
        description: "Vote was successful"
      }
    }
  };

  return { POST };
};
