const ElasticMapper = require( "elasticmaps" );
const openapiUtil = require( "../../../../../openapi_util" );

const parameters = openapiUtil.getParameters( "tile_path", { except: ["X-HTTP-Method-Override", "fields"] } ).concat(
  openapiUtil.getParameters( "observations_search", { except: ["fields", "X-HTTP-Method-Override"] } )
);

module.exports = sendWrapper => {
  async function GET( req, res ) {
    req.params.style = "heatmap";
    req.params.format = "png";
    ElasticMapper.route( req, res, ( err, data ) => {
      sendWrapper( req, res, err, data );
    } );
  }

  GET.apiDoc = {
    tags: ["Observation Tiles"],
    summary: "Grid Tiles",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "Returns heatmap tiles.",
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
