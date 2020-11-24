const j2s = require( "hapi-joi-to-swagger" );
const observationPhotosCreateSchema = require( "../../schema/request/observation_photos_create" );
const ObservationPhotosController = require( "../../../lib/controllers/v2/observation_photos_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await ObservationPhotosController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["ObservationPhotos"],
    summary: "Create observation photos",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: j2s( observationPhotosCreateSchema ).swagger
        }
      }
    },
    responses: {
      200: {
        description: "A list of observation photos",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationPhotos"
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
