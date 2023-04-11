const j2s = require( "joi-to-swagger" );
const logCreateSchema = require( "../../schema/request/log_create" );
const LogController = require( "../../../lib/controllers/v2/log_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    await LogController.create( req );
    sendWrapper( req, res.status( 204 ) );
  }

  POST.apiDoc = {
    tags: ["Log"],
    summary: "Log events in a client application",
    description: "Creates entries in our internal logging system "
      + "for events in client application, mostly for the purpose of "
      + "monitoring application health",
    security: [{
      appAndUserJwtRequired: []
    }],
    "x-unpublished": true,
    requestBody: {
      content: {
        "application/json": {
          schema: j2s( logCreateSchema ).swagger
        }
      }
    },
    responses: {
      204: {
        description: "Log successful created"
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  return {
    POST
  };
};
