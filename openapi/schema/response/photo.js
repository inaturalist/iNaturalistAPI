const Joi = require( "@hapi/joi" );
const flag = require( "./flag" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  attribution: Joi.string( ),
  flags: Joi.array( ).items( flag ),
  large_url: Joi.string( ),
  license_code: Joi.string( ).valid( null ),
  medium_url: Joi.string( ),
  native_page_url: Joi.string( ).valid( null ),
  native_photo_id: Joi.string( ),
  original_dimensions: Joi.object( ).keys( {
    height: Joi.number( ).integer( ),
    width: Joi.number( ).integer( )
  } ).unknown( false ).valid( null ),
  original_url: Joi.string( ),
  small_url: Joi.string( ),
  square_url: Joi.string( ),
  type: Joi.string( ),
  url: Joi.string( )
} ).unknown( false ).meta( { className: "Photo" } )
  .valid( null );
