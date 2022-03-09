const ctrlv1 = require( "../v1/computervision_controller" );
const Observation = require( "../../models/observation" );
const { uuidsToSerialIds } = require( "../../util" );

const scoreObservation = async req => {
  await uuidsToSerialIds( req, Observation );
  return ctrlv1.scoreObservation( req );
};

module.exports = {
  scoreImage: ctrlv1.scoreImage,
  scoreObservation
};
