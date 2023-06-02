// eslint-disable-next-line camelcase
const ctrlv1 = require( "../v1/taxon_name_priorities_controller" );

const create = async req => {
  const taxonNamePriority = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [taxonNamePriority]
  };
};

const update = async req => {
  const taxonNamePriority = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [taxonNamePriority]
  };
};

module.exports = {
  create,
  update,
  delete: ctrlv1.delete
};
