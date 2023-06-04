const Joi = require( "joi" );
const taxonNamePriority = require( "./taxon_name_priority" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( taxonNamePriority ).required( )
} ).unknown( false );
