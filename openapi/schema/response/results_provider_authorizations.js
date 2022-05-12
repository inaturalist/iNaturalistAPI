const Joi = require( "joi" );
const providerAuthorization = require( "./provider_authorization" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( providerAuthorization ).required( )
} ).unknown( false );
