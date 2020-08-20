const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  attribution: Joi.string( ),
  file_content_type: Joi.string( ).valid( null ),
  file_url: Joi.string( ).valid( null ),
  license_code: Joi.string( ).valid( null ),
  native_sound_id: Joi.string( ).valid( null ),
  play_local: Joi.boolean( ),
  secret_token: Joi.string( ).valid( null ),
  subtype: Joi.string( ).valid( null )
} ).unknown( false ).meta( { className: "Sound" } );
