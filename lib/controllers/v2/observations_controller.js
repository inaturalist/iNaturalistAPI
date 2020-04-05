const _ = require( "lodash" );
const ESModel = require( "../../models/es_model" );
const Observation = require( "../../models/observation" );
const ctrlv1 = require( "../v1/observations_controller" );

const show = req => {
  const uuids = req.params.uuid.slice( 0, 200 );
  req.query = Object.assign( req.query, {
    uuid: uuids,
    details: "all",
    per_page: uuids.length
  } );
  return ctrlv1.searchCacheWrapper( req );
};

const create = async req => {
  const observation = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [observation]
  };
};

const qualityMetrics = async req => {
  const uuids = req.params.uuid.slice( 0, 200 );
  const observationsByUuid = await ESModel.findByUuids( uuids, Observation );
  req.params = Object.assign( req.params, {
    id: _.map( observationsByUuid, v => v.id )
  } );
  return ctrlv1.qualityMetrics( req );
};

module.exports = {
  show,
  search: ctrlv1.search,
  create,
  qualityMetrics
};
