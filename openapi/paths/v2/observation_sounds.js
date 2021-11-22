const j2s = require( "joi-to-swagger" );
const observationSoundsCreateSchema = require( "../../schema/request/observation_sounds_create" );
const ObservationSoundsController = require( "../../../lib/controllers/v2/observation_sounds_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await ObservationSoundsController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["ObservationSounds"],
    summary: "Create observation sounds",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: j2s( observationSoundsCreateSchema ).swagger
        }
      }
    },
    responses: {
      200: {
        description: "A list of observation sounds",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationSounds"
            }
          }
        }
      }
    }
  };

  return {
    POST
  };
};
