const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( Joi.object( ).keys( {
    ip: Joi.string( ).ip( ).required( ),
    range: Joi.alternatives( ).try(
      Joi.string( ),
      Joi.array( ).items( Joi.number( ).integer( ) )
    ),
    country: Joi.string( ),
    region: Joi.string( ),
    eu: Joi.string( ),
    timezone: Joi.string( ),
    city: Joi.string( ),
    ll: Joi.array( ).items( Joi.number( ) ),
    metro: Joi.number( ).integer( ),
    area: Joi.number( ).integer( )
  } ) ).required( )
} ).unknown( false );
