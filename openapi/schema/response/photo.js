const Joi = require( "joi" );
const flag = require( "./flag" );
const moderatorAction = require( "./moderator_action" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  attribution: Joi.string( ),
  flags: Joi.array( ).items( flag ),
  hidden: Joi.boolean( ),
  large_url: Joi.string( ).valid( null ),
  license_code: Joi.string( ).valid( null ),
  medium_url: Joi.string( ).valid( null ),
  moderator_actions: Joi.array( ).items( moderatorAction ),
  native_page_url: Joi.string( ).valid( null ),
  native_photo_id: Joi.string( ).valid( null ),
  original_dimensions: Joi.object( ).keys( {
    height: Joi.number( ).integer( ).valid( null ),
    width: Joi.number( ).integer( ).valid( null )
  } ).unknown( false ).valid( null ),
  original_url: Joi.string( ).valid( null ),
  small_url: Joi.string( ).valid( null ),
  square_url: Joi.string( ).valid( null ),
  type: Joi.string( ),
  url: Joi.string( ).valid( null )
} ).unknown( false ).meta( { className: "Photo" } )
  .valid( null );
