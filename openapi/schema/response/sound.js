const Joi = require( "joi" );
const flag = require( "./flag" );
const moderatorAction = require( "./moderator_action" );

module.exports = Joi.object( ).keys( {
  attribution: Joi.string( ),
  file_content_type: Joi.string( ),
  file_url: Joi.string( ),
  flags: Joi.array( ).items( flag ),
  hidden: Joi.boolean( ),
  id: Joi.number( ).integer( ).description( "Unique auto-increment integer identifier." ).required( ),
  license_code: Joi.string( ).valid( null ),
  moderator_actions: Joi.array( ).items( moderatorAction ),
  native_sound_id: Joi.string( ).valid( null )
} ).unknown( false ).meta( { className: "Sound" } )
  .valid( null );
