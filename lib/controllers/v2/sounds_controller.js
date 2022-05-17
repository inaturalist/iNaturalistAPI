const ctrlv1 = require( "../v1/sounds_controller" );

const create = async req => {
  const sound = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [sound]
  };
};

module.exports = {
  create
};
