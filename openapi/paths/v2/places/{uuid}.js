const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const PlacesController = require( "../../../../lib/controllers/v2/places_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await PlacesController.show( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Places"],
    summary: "Fetch places",
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID or a comma-separated list of them" )
      ),
      transform(
        Joi.string( ).label( "lat" ).meta( { in: "query" } )
          .description( "Latitude of coordinate used to sort results by distance" )
      ),
      transform(
        Joi.string( ).label( "lng" ).meta( { in: "query" } )
          .description( "Longitude of coordinate used to sort results by distance" )
      ),
      transform(
        Joi
          .string( )
          .label( "order_by" ).meta( { in: "query" } )
          .description( "Order results by admin level and distance from a point specified in lat and lng" )
          .valid( "admin_and_distance" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of places",
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
