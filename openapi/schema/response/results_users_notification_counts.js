const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  updates_count: Joi.number( ).integer( ).required( ),
  messages_count: Joi.number( ).integer( ).required( )
} ).unknown( false );
