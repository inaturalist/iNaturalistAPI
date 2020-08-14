const ctrlv1 = require( "../v1/computervision_controller" );
const { uuidsToObservatioIds } = require( "../../util" );

const scoreObservation = async req => {
  await uuidsToObservatioIds( req );
  return ctrlv1.scoreObservation( req );
};

module.exports = {
  scoreObservation
};
