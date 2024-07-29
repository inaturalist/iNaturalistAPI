const _ = require( "lodash" );
const savedLocationsSearchSchema = require( "../../schema/request/saved_locations_search" );
const transform = require( "../../joi_to_openapi_parameter" );
const SavedLocationsController = require( "../../../lib/controllers/v2/saved_locations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const response = await SavedLocationsController.search( req );
    sendWrapper( req, res, null, response );
  }

  GET.apiDoc = {
    tags: ["SavedLocations"],
    summary: "Retrieve saved locations for the authenticated user",
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
    ].concat( _.map( savedLocationsSearchSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    ) ) ),
    responses: {
      200: {
        description: "An array of saved locations",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsSavedLocations"
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
    const results = await SavedLocationsController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["SavedLocations"],
    summary: "Create a saved location",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/SavedLocationsCreate"
          }
        }
      }
    },
    responses: {
      200: {
        description: "An array of saved locations",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsSavedLocations"
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
