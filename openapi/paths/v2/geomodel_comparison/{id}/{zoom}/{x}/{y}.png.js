const Joi = require( "joi" );
const transform = require( "../../../../../../joi_to_openapi_parameter" );
const { tilePathParams } = require( "../../../../../../common_parameters" );
const InaturalistMapserver = require( "../../../../../../../lib/inaturalist_map_server" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    req.params.format = "png";
    req.params.taxon_id = req.params.id;
    await InaturalistMapserver.geomodelComparisonRoute( req, res );
    sendWrapper( req, res, null, null );
  }

  GET.apiDoc = {
    tags: ["Polygon Tiles"],
    summary: "Taxon Geomodel Comparison Tiles",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      transform( Joi.string( ).label( "id" ).meta( { in: "path" } ).required( ) )
    ].concat( tilePathParams ),
    responses: {
      200: {
        description: "Returns taxon geomodel comparison tiles.",
        content: {
          "image/png": {
            schema: {
              type: "string",
              format: "binary"
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
