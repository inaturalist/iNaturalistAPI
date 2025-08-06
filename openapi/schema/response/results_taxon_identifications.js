const Joi = require( "joi" );
const taxonIdentification = require( "./taxon_identification" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( taxonIdentification ).required( )
} ).unknown( false );
