const { annotations } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const create = async req => {
  const annotation = await InaturalistAPI.iNatJSWrap( annotations.create, req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [annotation]
  };
};

const destroy = async req => {
  req.params.id = req.params.id || req.params.uuid;
  InaturalistAPI.iNatJSWrap( annotations.delete, req );
  return null;
};

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
  create,
  delete: destroy,
  vote,
  unvote
};
