const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  is_active: Joi.boolean( ),
  per_page: Joi.number( ).integer( ),
  locale: Joi.string( ),
  preferred_place_id: Joi.number( ).integer( ),
  fields: Joi.any( )
} );
