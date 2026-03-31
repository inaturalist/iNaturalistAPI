module.exports = sendWrapper => {
  async function GET( req, res ) {
    sendWrapper( req, res, null, { status: "available" } );
  }

  GET.apiDoc = {
    tags: ["Ping"],
    summary: "Check API availability",
    responses: {
      200: {
        description: "A simple availability response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  example: "available"
                }
              },
              required: ["status"]
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    },
    "x-default-ttl": -1
  };

  return {
    GET
  };
};
