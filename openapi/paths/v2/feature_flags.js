const FeatureFlagsController = require( "../../../lib/controllers/v2/feature_flags_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    // A ttl param would let setCacheControlHeaders mark this per-actor payload
    // public and shared-cacheable; drop it before it reaches the wrapper or Rails
    delete req.query.ttl;
    const results = await FeatureFlagsController.index( req );
    res.setHeader( "Cache-Control", "private, max-age=60" );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["FeatureFlags"],
    summary: "Feature flags and experiment variants for the current actor",
    description: "Returns every client-visible feature flag as a boolean and every "
      + "experiment as its assigned variant (\"control\", \"treatment\", or null when "
      + "not enrolled). Keys are dynamic; treat a missing key as off / not enrolled. "
      + "Without a token, or with an application token, everything resolves for an "
      + "anonymous actor. The response is per-actor and only privately cacheable.",
    security: [{
      userJwtOptional: []
    }],
    responses: {
      200: {
        description: "Flags and experiment variants",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/FeatureFlags"
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    },
    "x-unpublished": true
  };

  return {
    GET
  };
};
