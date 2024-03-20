const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  observation_photo: Joi.object( ).keys( {
    observation_id: Joi.string( ).guid( ).required( ),
    photo_id: Joi.number( ).integer( ),
    uuid: Joi.string( ).guid( )
  } )
} ).unknown( true );
