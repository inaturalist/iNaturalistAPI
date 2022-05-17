const j2s = require( "joi-to-swagger" );
const soundsCreateSchema = require( "../../schema/request/sounds_create" );
const SoundsController = require( "../../../lib/controllers/v2/sounds_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await SoundsController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["Sounds"],
    summary: "Create sounds",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: j2s( soundsCreateSchema ).swagger
        }
      }
    },
    responses: {
      200: {
        description: "Sound created"
      }
    }
  };

  return {
    POST
  };
};
