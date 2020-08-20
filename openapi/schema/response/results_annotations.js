const Joi = require( "@hapi/joi" );
const annotation = require( "./annotation" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( annotation ).required( )
} ).unknown( false );
