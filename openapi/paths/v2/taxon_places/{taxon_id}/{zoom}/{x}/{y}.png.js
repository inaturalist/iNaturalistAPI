const Joi = require( "joi" );
const transform = require( "../../../../../../joi_to_openapi_parameter" );
const { tilePathParams } = require( "../../../../../../common_parameters" );
const InaturalistMapserver = require( "../../../../../../../lib/inaturalist_map_server" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    req.params.format = "png";
    InaturalistMapserver.taxonPlacesRoute( req, res, ( err, data ) => {
      sendWrapper( req, res, err, data );
    } );
  }

  GET.apiDoc = {
    tags: ["Polygon Tiles"],
    summary: "Taxon Place Tiles",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      transform( Joi.string( ).label( "taxon_id" ).meta( { in: "path" } ).required( ) )
    ].concat( tilePathParams ),
    responses: {
      200: {
        description: "Returns a PNG map tile representing the boundaries of places this taxon is known to occur, following the XYZ tiling scheme.",
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
