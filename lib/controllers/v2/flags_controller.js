const ctrlv1 = require( "../v1/flags_controller" );

const create = async req => {
  const flag = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [flag]
  };
};

const update = async req => {
  const flag = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [flag]
  };
};

module.exports = {
  create,
  update,
  delete: ctrlv1.delete
};
