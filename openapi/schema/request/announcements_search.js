const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  placement: Joi.string( ).valid(
    "users/dashboard#sidebar",
    "users/dashboard",
    "welcome/index",
    "mobile/home",
    "mobile"
  ),
  locale: Joi.string( ),
  fields: Joi.any( )
} ).unknown( false );
