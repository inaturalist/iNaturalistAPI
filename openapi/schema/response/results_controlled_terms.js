const Joi = require( "joi" );
const controlledTerm = require( "./controlled_term" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( controlledTerm ).required( )
} ).unknown( false );
