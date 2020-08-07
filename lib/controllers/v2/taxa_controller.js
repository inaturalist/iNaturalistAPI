// const nodeUtil = require( "util" );
// const _ = require( "lodash" );
const ctrlv1 = require( "../v1/taxa_controller" );
const ESModel = require( "../../models/es_model" );
const Observation = require( "../../models/observation" );

const show = async req => {
  req.params.id = req.params.id.join( "," );
  return ctrlv1.show( req );
};

const suggest = async req => {
  if ( req.query.featured_observation_id ) {
    const observationsByUuid = await ESModel.findByUuids(
      [req.query.featured_observation_id],
      Observation
    );
    if ( observationsByUuid[req.query.featured_observation_id] ) {
      req.query.featured_observation_id = observationsByUuid[req.query.featured_observation_id].id;
    } else {
      delete req.query.featured_observation_id;
    }
  }
  return ctrlv1.suggest( req );
};

module.exports = {
  autocomplete: ctrlv1.autocomplete,
  show,
  suggest
};
