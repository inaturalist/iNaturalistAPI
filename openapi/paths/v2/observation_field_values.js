const j2s = require( "joi-to-swagger" );
const observationFieldValuesCreateSchema = require( "../../schema/request/observation_field_values_create" );
const ObservationFieldValuesController = require( "../../../lib/controllers/v2/observation_field_values_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    const results = await ObservationFieldValuesController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["ObservationFieldValues"],
    summary: "Create observation field values",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: j2s( observationFieldValuesCreateSchema ).swagger
        }
      }
    },
    responses: {
      200: {
        description: "A list of observation field values",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservationFieldValues"
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
