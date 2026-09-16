// eslint-disable-next-line camelcase
const { feature_flags } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const Logstasher = require( "../../logstasher" );

// Proxies Rails GET /feature_flags, the single flag evaluator. The Authorization
// header (user or application JWT, or nothing) is forwarded untouched by
// iNatJSWrap so Rails resolves the actor; Node never evaluates flags itself.
const index = async req => {
  // Resolve the method outside the try so a stale inaturalistjs without the
  // endpoint fails loudly instead of masquerading as an upstream outage
  // eslint-disable-next-line camelcase
  const { get } = feature_flags;
  try {
    const json = await InaturalistAPI.iNatJSWrap( get, req );
    // Only the documented keys pass through; strict response validation
    // would otherwise turn a new Rails key into a 500 for every client
    return {
      flags: ( json && json.flags ) || { },
      experiments: ( json && json.experiments ) || { }
    };
  } catch ( err ) {
    // Fail closed: Rails unreachable or erroring reads as "everything off",
    // matching how Rails itself fails closed on flag storage errors
    Logstasher.writeFeatureFlagsUpstreamErrorLog( err );
    return { flags: { }, experiments: { } };
  }
};

module.exports = {
  index
};
