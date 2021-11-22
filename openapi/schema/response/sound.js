const Joi = require( "joi" );
const flag = require( "./flag" );

module.exports = Joi.object( ).keys( {
  attribution: Joi.string( ),
  file_content_type: Joi.string( ),
  file_url: Joi.string( ),
  flags: Joi.array( ).items( flag ),
  id: Joi.number( ).integer( ).description( "Unique auto-increment integer identifier." ).required( ),
  license_code: Joi.string( ).valid( null ),
  native_sound_id: Joi.string( )
} ).unknown( false ).meta( { className: "Sound" } )
  .valid( null );
