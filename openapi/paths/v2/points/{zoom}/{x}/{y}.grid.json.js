const ElasticMapper = require( "elasticmaps" );
const openapiUtil = require( "../../../../../openapi_util" );

const parameters = openapiUtil.getParameters( "tile_path", { except: ["X-HTTP-Method-Override", "fields"] } ).concat(
  openapiUtil.getParameters( "observations_search", { except: ["fields", "X-HTTP-Method-Override"] } )
);

module.exports = sendWrapper => {
  async function GET( req, res ) {
    req.params.style = "points";
    req.params.format = "grid.json";
    ElasticMapper.routeWithCallback( req, res, ( err, data ) => {
      sendWrapper( req, res, err, data );
    } );
  }

  GET.apiDoc = {
    tags: ["UTFGrid"],
    summary: "JSON for points tiles",
    security: [{
      userJwtOptional: []
    }],
    parameters,
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
