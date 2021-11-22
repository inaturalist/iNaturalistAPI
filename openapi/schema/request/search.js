const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  locale: Joi.string( ),
  place_id: Joi.number( ).integer( ),
  preferred_place_id: Joi.number( ).integer( ),
  sources: Joi.array( ).items( Joi.string( ).valid(
    "places",
    "projects",
    "taxa",
    "users"
  ) ),
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.any( )
    .description( "Attribute fields to return in the response" )
    .example( "species_guess,observed_on" )
    .default( "record.id" )
} );
