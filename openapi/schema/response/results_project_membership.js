const Joi = require( "joi" );
const projectMembership = require( "./project_membership" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( projectMembership ).required( )
} ).unknown( false );
