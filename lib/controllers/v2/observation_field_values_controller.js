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

module.exports = {
  create
};
