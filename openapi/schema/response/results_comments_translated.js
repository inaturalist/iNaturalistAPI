const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  translation: Joi.string( )
} ).unknown( false );
