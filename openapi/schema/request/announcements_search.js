const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  placement: Joi.string( ).valid(
    "users/dashboard#sidebar",
    "users/dashboard",
    "welcome/index",
    "mobile/home",
    "mobile"
  ),
  platform: Joi.string( ).valid(
    "inat-ios",
    "inat-android",
    "seek",
    "inatrn"
  ),
  locale: Joi.string( ),
  fields: Joi.any( )
} ).unknown( false );
