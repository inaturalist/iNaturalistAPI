const Joi = require( "joi" );
const taxon = require( "./taxon" );
const identification = require( "./identification" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  all_results_available: Joi.boolean( ),
  results: Joi.array( ).items( Joi.object( {
    taxon: taxon.required( ),
    identification: identification.required( )
  } ) ).required( )
} ).unknown( false );
