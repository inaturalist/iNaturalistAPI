const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  observed_by_user_id: Joi.alternatives( ).try(
    Joi.number( ).integer( ),
    Joi.string( )
  ).required( ),
  locale: Joi.string( ),
  preferred_place_id: Joi.number( ).integer( ),
  fields: Joi.any( )
} );
