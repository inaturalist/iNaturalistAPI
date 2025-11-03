const Joi = require( "joi" );
const taxonIdSummary = require( "./taxon_id_summary" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( taxonIdSummary ).required( )
} ).unknown( false );
