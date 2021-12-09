const Joi = require( "joi" );
const taxonCount = require( "./taxon_count" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( taxonCount ).required( )
} ).unknown( false );
