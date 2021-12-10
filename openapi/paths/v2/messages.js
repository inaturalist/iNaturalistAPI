const _ = require( "lodash" );
const messagesSchema = require( "../../schema/request/messages" );
const transform = require( "../../joi_to_openapi_parameter" );
const MessagesController = require( "../../../lib/controllers/v2/messages_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await MessagesController.index( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Messages"],
    summary: "Retrieve messages for the authenticated user",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      {
        in: "header",
        name: "X-HTTP-Method-Override",
        schema: {
          type: "string"
        }
      }
    ].concat( _.map( messagesSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    ) ) ),
    responses: {
      200: {
        description: "A list of messages",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsMessages"
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  async function POST( req, res ) {
    const results = await MessagesController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["Messages"],
    summary: "Create a message",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/MessagesCreate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "A list of messages",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsMessages"
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
    GET,
    POST
  };
};
