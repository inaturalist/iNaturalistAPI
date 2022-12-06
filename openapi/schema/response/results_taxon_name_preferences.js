const Joi = require( "joi" );
const taxonNamePreference = require( "./taxon_name_preference" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( taxonNamePreference ).required( )
} ).unknown( false );
