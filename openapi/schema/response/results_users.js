const Joi = require( "@hapi/joi" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( user ).required( )
} ).unknown( false );
