const Joi = require( "joi" );
const transform = require( "../../../../../../joi_to_openapi_parameter" );
const { tilePathParams } = require( "../../../../../../common_parameters" );
const InaturalistMapserver = require( "../../../../../../../lib/inaturalist_map_server" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    req.params.style = "places";
    req.params.format = "png";
    req.params.place_id = req.params.id;
    InaturalistMapserver.placesRoute( req, res, ( err, data ) => {
      sendWrapper( req, res, err, data );
    } );
  }

  GET.apiDoc = {
    tags: ["Polygon Tiles"],
    summary: "Place Tiles",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      transform( Joi.string( ).label( "id" ).meta( { in: "path" } ).required( ) )
    ].concat( tilePathParams ),
    responses: {
      200: {
        description: "Returns place tiles.",
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
