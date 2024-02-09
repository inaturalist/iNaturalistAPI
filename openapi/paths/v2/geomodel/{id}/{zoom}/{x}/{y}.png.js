const Joi = require( "joi" );
const transform = require( "../../../../../../joi_to_openapi_parameter" );
const { tilePathParams } = require( "../../../../../../common_parameters" );
const InaturalistMapserver = require( "../../../../../../../lib/inaturalist_map_server" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    req.params.format = "png";
    req.params.taxon_id = req.params.id;
    await InaturalistMapserver.geomodelRoute( req, res );
    sendWrapper( req, res, null, null );
  }

  GET.apiDoc = {
    tags: ["Polygon Tiles"],
    summary: "Taxon Geomodel Tiles",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      transform( Joi.string( ).label( "id" ).meta( { in: "path" } ).required( ) )
    ].concat( tilePathParams ).concat( transform(
      Joi.boolean( )
        .label( "thresholded" )
        .description( "Set to true to render only cells above the Seen Nearby threshold" )
        .meta( { in: "query" } )
    ) ),
    responses: {
      200: {
        description: "Returns taxon geomodel tiles.",
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
