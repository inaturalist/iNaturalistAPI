const _ = require( "lodash" );
const ctrlv1 = require( "../v1/identifications_controller" );
const observationsControllerV1 = require( "../v1/observations_controller" );
const Taxon = require( "../../models/taxon" );

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

const recentTaxa = async req => {
  if ( req.query.taxon_id && _.size( req.query.taxon_id ) === 1 ) {
    req.inat.taxon = await Taxon.findByID( req.query.taxon_id[0] );
  }
  return ctrlv1.recentTaxa( req );
};

module.exports = {
  create,
  delete: destroy,
  identifiers: ctrlv1.identifiers,
  recentTaxa,
  similarSpecies: observationsControllerV1.similarSpecies,
  update
};
