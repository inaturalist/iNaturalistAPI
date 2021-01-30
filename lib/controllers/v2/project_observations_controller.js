const ctrlv1 = require( "../v1/project_observations_controller" );

const create = async req => {
  const projectObservation = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [projectObservation]
  };
};

const update = async req => {
  const { uuid } = req.params;
  req.params.id = uuid;
  delete req.params.uuid;
  const projectObservation = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [projectObservation]
  };
};

// delete is a reserved word and you can't declare a method with that name in a
// module
const destroy = async req => {
  const { uuid } = req.params;
  req.params.id = uuid;
  delete req.params.uuid;
  return ctrlv1.delete( req );
};

module.exports = {
  create,
  update,
  delete: destroy
};
