const Joi = require( "joi" );
const savedLocation = require( "./saved_location" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( savedLocation ).required( )
} ).unknown( false );
