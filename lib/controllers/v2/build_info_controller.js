const process = require( "process" );
const util = require( "../../util" );

const index = async req => {
  if ( !util.isInternalRequest( req ) ) {
    throw util.httpError( 401, "Unauthorized" );
  }
  const buildInfoJSON = {
    git_branch: process.env.GIT_BRANCH,
    git_commit: process.env.GIT_COMMIT,
    image_tag: process.env.IMAGE_TAG,
    build_date: process.env.BUILD_DATE
  };
  return buildInfoJSON;
};

module.exports = {
  index
};
