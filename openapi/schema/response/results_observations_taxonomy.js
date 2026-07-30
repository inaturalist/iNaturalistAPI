const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  count_without_taxon: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( ).required( ),
    name: Joi.string( ),
    rank: Joi.string( ),
    rank_level: Joi.number( ),
    is_active: Joi.boolean( ),
    iconic_taxon_name: Joi.string( ).valid( null ),
    parent_id: Joi.number( ).integer( ).valid( null ),
    descendant_obs_count: Joi.number( ).integer( ),
    direct_obs_count: Joi.number( ).integer( )
  } ) ).required( )
} ).unknown( false );
