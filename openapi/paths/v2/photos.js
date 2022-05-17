const j2s = require( "joi-to-swagger" );
const photosCreateSchema = require( "../../schema/request/photos_create" );
const PhotosController = require( "../../../lib/controllers/v2/photos_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await PhotosController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["Photos"],
    summary: "Create photos",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: j2s( photosCreateSchema ).swagger
        }
      }
    },
    responses: {
      200: {
        description: "An array of photos.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsPhotos"
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
    POST
  };
};
