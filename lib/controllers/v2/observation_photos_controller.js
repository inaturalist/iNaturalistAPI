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

const update = async req => {
  req.body.observation_photo.uuid = req.params.uuid;
  const observationPhoto = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [observationPhoto]
  };
};

module.exports = {
  create,
  delete: ctrlv1.delete,
  update
};
