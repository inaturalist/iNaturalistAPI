const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const MessagesController = require( "../../../../lib/controllers/v2/messages_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await MessagesController.show( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Messages"],
    summary: "Retrieve messages in a thread",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "ID of the record" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of messages.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsMessagesThread"
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
