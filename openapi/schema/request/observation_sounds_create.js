const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  observation_sound: Joi.object( ).keys( {
    observation_id: Joi.string( ).guid( ).required( ),
    sound_id: Joi.number( ).integer( )
  } )
} ).unknown( true );
