const Joi = require( "joi" );
const privateUser = require( "./private_user" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( privateUser ).required( )
} ).unknown( false );
