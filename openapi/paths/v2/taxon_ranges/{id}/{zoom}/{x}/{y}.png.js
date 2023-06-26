const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../../../../joi_to_openapi_parameter" );
const observationsSearchSchema = require( "../../../../../../schema/request/observations_search" );
const { tilePathParams } = require( "../../../../../../common_parameters" );
const InaturalistMapserver = require( "../../../../../../../lib/inaturalist_map_server" );

const inheritdObsSearchParams = _.filter(
  observationsSearchSchema.$_terms.keys, p => !_.includes( ["id", "fields"], p.key )
);
const transformedObsSearchParams = _.map( inheritdObsSearchParams, p => (
  transform( p.schema.label( p.key ) )
) );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    req.params.style = "places";
    req.params.format = "png";
    req.params.taxon_id = req.params.id;
    await InaturalistMapserver.taxonRangesRoute( req, res );
    sendWrapper( req, res, null, null );
  }

  GET.apiDoc = {
    tags: ["Polygon Tiles"],
    summary: "Taxon Range Tiles",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      transform( Joi.string( ).label( "id" ).meta( { in: "path" } ).required( ) )
    ].concat( tilePathParams ).concat( transformedObsSearchParams ),
    responses: {
      200: {
        description: "Returns taxon range tiles.",
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
