const Joi = require( "joi" );
const transform = require( "../../joi_to_openapi_parameter" );
const GeoipController = require( "../../../lib/controllers/v1/geoip_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const v1Response = await GeoipController.lookup( req );
    const response = {
      total_results: 1,
      page: 1,
      per_page: 1,
      results: [{
        ...v1Response.results,
        ip: req.query.ip
      }]
    };
    sendWrapper( req, res, null, response );
  }

  GET.apiDoc = {
    tags: ["GeoIP"],
    summary: "Fetch GeoIP information",
    security: [{
      appOrUserJwtRequired: []
    }],
    "x-unpublished": true,
    parameters: [
      transform(
        Joi.string( )
          .ip( )
          .label( "ip" )
          .required( )
          .description( "An IP address" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "An array of GeoIP information",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsGeoipLookup"
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
    GET
  };
};
