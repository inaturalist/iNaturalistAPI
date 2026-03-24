const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  direct_taxon_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  taxon_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  term_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  term_value_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  q: Joi.string( ),
  id: Joi.number( ).integer( ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  upvoted: Joi.boolean( ),
  downvoted: Joi.boolean( ),
  nominated: Joi.boolean( ),
  include_category_counts: Joi.boolean( ),
  include_category_controlled_terms: Joi.boolean( ),
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
