const { build_info } = require( "inaturalistjs" );
const process = require( "process" );
const fetch = require( "node-fetch" );
const InaturalistAPI = require( "../../inaturalist_api" );
const util = require( "../../util" );
const config = require( "../../../config" );

const index = async req => {
  if ( !req.userSession || ( req.userSession && !req.userSession.isAdmin ) ) {
    throw util.httpError( 401, "Unauthorized" );
  }
  // Get Rails Build Info
  const railsBuildInfoJSON = await InaturalistAPI.iNatJSWrap( build_info.get, req );
  // Get API Build Info
  const apiBuildInfoJSON = {
    git_branch: process.env.GIT_BRANCH,
    git_commit: process.env.GIT_COMMIT,
    image_tag: process.env.IMAGE_TAG,
    build_date: process.env.BUILD_DATE
  };
  // Get Vision Build Info
  let visionBuildInfoJSON = {};
  try {
    const response = await fetch( `${config.imageProcesing.tensorappURL}/build_info` );
    if ( !response.ok ) {
      throw util.httpError( 500, "Error" );
    }
    visionBuildInfoJSON = await response.json( );
  } catch ( error ) {
    throw util.httpError( 500, "Error" );
  }
  // Application Build Info
  const appBuildInfoJSON = {
    rails: railsBuildInfoJSON,
    api: apiBuildInfoJSON,
    vision: visionBuildInfoJSON
  };
  return appBuildInfoJSON;
};

module.exports = {
  index
};
