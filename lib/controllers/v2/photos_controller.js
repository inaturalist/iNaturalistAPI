const ctrlv1 = require( "../v1/photos_controller" );

const create = async req => {
  await ctrlv1.create( req );
};

const update = async req => {
  const photo = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [photo]
  };
};

module.exports = {
  create,
  update
};
