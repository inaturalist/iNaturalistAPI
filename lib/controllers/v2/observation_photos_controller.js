const ctrlv1 = require( "../v1/observation_photos_controller" );

const create = async req => {
  const observationPhoto = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [observationPhoto]
  };
};

module.exports = {
  create
};
