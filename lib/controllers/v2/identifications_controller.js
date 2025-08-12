const { identifications } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ctrlv1 = require( "../v1/identifications_controller" );
const observationsControllerV1 = require( "../v1/observations_controller" );

const create = async req => {
  const response = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [response]
  };
};

const update = async req => {
  const { uuid } = req.params;
  req.params.id = uuid;
  const response = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [response]
  };
};

const destroy = async req => {
  const { uuid } = req.params;
  req.params.id = uuid;
  delete req.params.uuid;
  // Override the crazy thing in the Rails API that just withdraws when you
  // try to delete. DELETE should really delete.
  req.body.delete = true;
  return ctrlv1.delete( req );
};

const vote = async req => {
  req.params.id = req.params.id || req.params.uuid;
  // If there are no errors, this will be a 204 and there's no response
  await InaturalistAPI.iNatJSWrap( identifications.vote, req );
  return null;
};

const unvote = async req => {
  req.params.id = req.params.id || req.params.uuid;
  // If there are no errors, this will be a 204 and there's no response
  await InaturalistAPI.iNatJSWrap( identifications.unvote, req );
  return null;
};

module.exports = {
  create,
  delete: destroy,
  identifiers: ctrlv1.identifiers,
  recentTaxa: ctrlv1.recentTaxa,
  similarSpecies: observationsControllerV1.similarSpecies,
  update,
  vote,
  unvote
};
