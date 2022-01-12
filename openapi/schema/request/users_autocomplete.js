const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.any( )
} );
