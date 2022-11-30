const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  file: Joi.binary( ).required( ),
  fields: Joi.any( )
} ).unknown( true );
