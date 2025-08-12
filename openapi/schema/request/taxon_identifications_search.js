const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  taxon_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  term_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  term_value_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  q: Joi.string( ),
  locale: Joi.string( ),
  preferred_place_id: Joi.number( ).integer( ),
  ttl: Joi.number( ).integer( ),
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( ),
  order: Joi.string( ).valid(
    "desc",
    "asc"
  ).default( "desc" ),
  order_by: Joi.string( ).valid(
    "id",
    "created_at",
    "votes",
    "word_count"
  ).default( "id" ),
  fields: Joi.any( )
    .description( "Attribute fields to return in the response" )
} ).unknown( false );
