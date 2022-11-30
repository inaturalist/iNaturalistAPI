const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.alternatives( ).try(
    Joi.object( ).keys( {
      year: Joi.object( ).pattern( /^/, Joi.number( ).integer( ) ),
      month: Joi.object( ).pattern( /^/, Joi.number( ).integer( ) ),
      week: Joi.object( ).pattern( /^/, Joi.number( ).integer( ) ),
      day: Joi.object( ).pattern( /^/, Joi.number( ).integer( ) ),
      hour: Joi.object( ).pattern( /^/, Joi.number( ).integer( ) ),
      month_of_year: Joi.object( ).pattern( /^/, Joi.number( ).integer( ) ),
      week_of_year: Joi.object( ).pattern( /^/, Joi.number( ).integer( ) )
    } )
  ).required( )
} ).unknown( false );
