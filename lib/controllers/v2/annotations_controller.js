const { annotations } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const vote = async req => {
  req.params.id = req.params.id || req.params.uuid;
  // If there are no errors, this will be a 204 and there's no response
  InaturalistAPI.iNatJSWrap( annotations.vote, req );
  return null;
};

const unvote = async req => {
  req.params.id = req.params.id || req.params.uuid;
  // If there are no errors, this will be a 204 and there's no response
  InaturalistAPI.iNatJSWrap( annotations.unvote, req );
  return null;
};

module.exports = {
  vote,
  unvote
};
