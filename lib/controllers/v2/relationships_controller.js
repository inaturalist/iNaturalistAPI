const ctrlv1 = require( "../v1/relationships_controller" );

const create = async req => {
  const relationship = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [relationship]
  };
};

const update = async req => {
  const relationship = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [relationship]
  };
};

module.exports = {
  index: ctrlv1.index,
  create,
  update,
  delete: ctrlv1.delete
};
