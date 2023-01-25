const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  observation_photo: Joi.object( ).keys( {
    observation_id: Joi.string( ).guid( ).required( ),
    position: Joi.number( ).integer( )
  } ).unknown( true )
} ).unknown( false );
