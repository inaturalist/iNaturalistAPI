const ctrlv1 = require( "../v1/identifications_controller" );

const create = async req => {
  const response = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [response]
  };
};

module.exports = {
  create,
  identifiers: ctrlv1.identifiers
};
