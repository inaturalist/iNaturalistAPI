const ctrlv1 = require( "../v1/relationships_controller" );
const Relationship = require( "../../models/relationship" );

const create = async req => {
  const relationship = await ctrlv1.create( req );
  let results = [];
  if ( relationship && relationship.friendship ) {
    results = [relationship.friendship];
    results[0].reciprocal_trust = relationship.reciprocal_trust;
    await Relationship.preloadInto( req, results );
  }
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results
  };
};

const update = async req => {
  const relationship = await ctrlv1.update( req );
  let results = [];
  if ( relationship && relationship.friendship ) {
    results = [relationship.friendship];
    results[0].reciprocal_trust = relationship.reciprocal_trust;
    await Relationship.preloadInto( req, results );
  }
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results
  };
};

module.exports = {
  index: ctrlv1.index,
  create,
  update,
  delete: ctrlv1.delete
};
