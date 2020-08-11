const _ = require( "lodash" );
const Joi = require( "@hapi/joi" );
const transform = require( "../../../../../../joi_to_openapi_parameter" );
const observationsSearchSchema = require( "../../../../../../schema/request/observations_search" );
const { tilePathParams } = require( "../../../../../../common_parameters" );
const InaturalistMapserver = require( "../../../../../../../lib/inaturalist_map_server" );

const inheritdObsSearchParams = _.filter(
  observationsSearchSchema._inner.children, p => !_.includes( ["id", "fields"], p.key )
);
const transformedObsSearchParams = _.map( inheritdObsSearchParams, p => (
  transform( p.schema.label( p.key ) )
) );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    req.params.style = "places";
    req.params.format = "png";
    req.params.place_id = req.params.id;
    InaturalistMapserver.placesRoute( req, res, ( err, data ) => {
      sendWrapper( req, res, err, data, "image/png" );
    } );
  }

  GET.apiDoc = {
    tags: ["Polygon Tiles"],
    summary: "Place Tiles",
    security: [{
      jwtOptional: []
    }],
    parameters: [
      transform( Joi.string( ).label( "id" ).meta( { in: "path" } ).required( ) )
    ].concat( tilePathParams ).concat( transformedObsSearchParams ),
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
