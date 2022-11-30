const ctrlv1 = require( "../v1/observation_field_values_controller" );

const create = async req => {
  const observationFieldValue = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [observationFieldValue]
  };
};

const update = async req => {
  const response = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [response]
  };
};

module.exports = {
  create,
  delete: ctrlv1.delete,
  update
};
