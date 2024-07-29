const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  page: Joi.number( ).integer( ),
  fields: Joi.any( )
} ).unknown( false );
