const _ = require( "lodash" );
const placesSearchSchema = require( "../../schema/request/places_search" );
const transform = require( "../../joi_to_openapi_parameter" );
const PlacesController = require( "../../../lib/controllers/v2/places_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await PlacesController.search( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Places"],
    summary: "Search places",
    parameters: [
      {
        in: "header",
        name: "X-HTTP-Method-Override",
        schema: {
          type: "string"
        }
      }
    ].concat( _.map( placesSearchSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    ) ) ),
    "x-default-ttl": 300,
    responses: {
      200: {
        description: "A list of places",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsPlaces"
            }
          }
        }
      }
    }
  };

  return {
    GET
  };
};
