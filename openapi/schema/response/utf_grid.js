const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  grid: Joi.array( ).items( Joi.string( ) ).required( ),
  keys: Joi.array( ).items( Joi.string( ) ).required( ),
  data: Joi.object( ).unknown( true ).required( )
} ).unknown( false );
