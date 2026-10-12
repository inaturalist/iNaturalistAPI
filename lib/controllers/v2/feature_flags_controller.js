// eslint-disable-next-line camelcase
const { feature_flags } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const Logstasher = require( "../../logstasher" );

const index = async req => {
  // Outside the try so a missing inaturalistjs method fails loudly
  // eslint-disable-next-line camelcase
  const { get } = feature_flags;
  try {
    const json = await InaturalistAPI.iNatJSWrap( get, req );
    // Strict response validation would 500 on undocumented keys
    return {
      flags: ( json && json.flags ) || { },
      experiments: ( json && json.experiments ) || { }
    };
  } catch ( err ) {
    // Fail closed: everything off
    Logstasher.writeFeatureFlagsUpstreamErrorLog( err );
    return { flags: { }, experiments: { } };
  }
};

module.exports = {
  index
};
