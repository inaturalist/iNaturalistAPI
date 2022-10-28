const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const PlacesController = require( "../../../../lib/controllers/v2/places_controller" );
const placesNearbySchema = require( "../../../schema/request/observations_histogram" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await PlacesController.nearby( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    placesNearbySchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Places"],
    summary: "Fetch nearby places",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "An object with metadata and an results object containing standard and community places.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsPlacesNearby"
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
