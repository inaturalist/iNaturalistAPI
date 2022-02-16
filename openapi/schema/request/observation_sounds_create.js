const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  // TODO Figure out how to get nested param validation to work. Currently it
  // seems to raise a weird JSON parsing error ~~ kueda 2020-03-04
  // observation_photo: Joi.object( ).keys( {
  //   observation_id: Joi.number( ).integer( )
  // } ).unknown( false ),
  file: Joi.binary( ).required( )
} ).unknown( true );
