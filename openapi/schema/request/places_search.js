const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  order_by: Joi.string( ).valid(
    "area"
  ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.any( )
} );
