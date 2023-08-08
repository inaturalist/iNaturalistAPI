const _ = require( "lodash" );
const InaturalistMapserver = require( "../../../../../../lib/inaturalist_map_server" );
const transform = require( "../../../../../joi_to_openapi_parameter" );
const observationsSearchSchema = require( "../../../../../schema/request/observations_search" );
const { tilePathParams } = require( "../../../../../common_parameters" );

const inheritdObsSearchParams = _.filter(
  observationsSearchSchema.$_terms.keys, p => !_.includes( ["fields"], p.key )
);
const transformedObsSearchParams = _.map( inheritdObsSearchParams, p => (
  transform( p.schema.label( p.key ) )
) );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    req.params.style = "points";
    req.params.format = "grid.json";
    await InaturalistMapserver.defaultRoute( req, res );
    sendWrapper( req, res );
  }

  GET.apiDoc = {
    tags: ["UTFGrid"],
    summary: "JSON for points tiles",
    security: [{
      userJwtOptional: []
    }],
    parameters: tilePathParams.concat( transformedObsSearchParams ),
    responses: {
      200: {
        description: "Returns a UTFGrid.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UtfGrid"
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
