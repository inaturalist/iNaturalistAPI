const Joi = require( "joi" );
const authorizedApplication = require( "./authorized_application" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( authorizedApplication ).required( )
} ).unknown( false );
