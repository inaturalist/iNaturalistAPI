const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  level: Joi.string( ).valid(
    "info",
    "debug",
    "error",
    "warn"
  ).description( "Level of log event" ),
  message: Joi.string( ),
  context: Joi.string( ),
  error_type: Joi.string( ),
  backtrace: Joi.string( )
} ).description(
  "Log an event that occurred in a client application"
);
