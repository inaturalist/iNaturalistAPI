const ObservationPhotosController = require( "../../../lib/controllers/v2/observation_photos_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await ObservationPhotosController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["ObservationPhotos"],
    summary: "Create observation photos",
    description: ""
      + "Use `multipart/form-data` to upload a new photo to an existing observation "
      + "and `application/json` to create a connetion between an existing "
      + "observation and an existing photo. Both accept a client-specified UUID "
      + "and have upsert behavior to prevent creating duplicate ObservationPhoto "
      + "records if requests succeed but fail to receive a response under poor "
      + "network conditions.",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: {
            $ref: "#/components/schemas/ObservationPhotosCreateMultipart"
          }
        },
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ObservationPhotosCreate"
          }
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
