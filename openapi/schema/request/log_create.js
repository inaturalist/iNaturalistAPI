const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  level: Joi.string( ).valid(
    "info",
    "debug",
    "error",
    "warn"
  ).description( "Level of log event" ),
  message: Joi.string( ).description( "What happened that was worth logging" ),
  context: Joi.string( ).description( "Brief description of where the log event came from, e.g. a file or class name" ),
  timestamp: Joi.date( ).description( "Datetime the event was logged in the client in case of asynchronous logging" ),
  error_type: Joi.string( ).description( "Type of error, e.g. java.lang.NoClassDefFoundError. Only used when level is error" ),
  backtrace: Joi.string( ).description( "Only used when level is error" )
} ).description(
  "Log an event that occurred in a client application"
).meta( { unpublished: true } );
