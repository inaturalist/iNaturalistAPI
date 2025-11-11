const Joi = require( "joi" );
const taxonIdentification = require( "./taxon_identification" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( taxonIdentification ).required( ),
  category_counts: Joi.object( ).keys( {
    upvoted: Joi.number( ).integer( ),
    no_votes: Joi.number( ).integer( ),
    downvoted: Joi.number( ).integer( ),
    not_nominated: Joi.number( ).integer( )
  } ),
  category_controlled_terms: Joi.array( ).items( Joi.object( ).keys( {
    count: Joi.number( ).integer( ).required( ),
    controlled_attribute: Joi.object( ).keys( {
      id: Joi.number( ).integer( ).required( ),
      label: Joi.string( )
    } ),
    controlled_value: Joi.object( ).keys( {
      id: Joi.number( ).integer( ).required( ),
      label: Joi.string( )
    } )
  } ) )
} ).unknown( false );
