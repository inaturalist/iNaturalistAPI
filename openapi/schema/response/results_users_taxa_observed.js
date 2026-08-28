const Joi = require( "joi" ).extend( require( "@joi/date" ) );
const taxon = require( "./taxon" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( Joi.object( ).keys( {
    count: Joi.number( ).integer( ).required( ),
    taxon: taxon.required( ),
    first_observed_on: Joi.date( ).format( "YYYY-MM-DD" ).valid( null ).required( )
  } ).unknown( false ) ).required( )
} ).unknown( false );
