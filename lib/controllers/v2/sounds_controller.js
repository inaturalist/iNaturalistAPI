const ctrlv1 = require( "../v1/sounds_controller" );

const create = async req => {
  await ctrlv1.create( req );
};

module.exports = {
  create
};
