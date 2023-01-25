const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  "observation_photo[observation_id]": Joi.string( ).guid( ).required( ),
  file: Joi.binary( ).required( )
} ).unknown( true );
