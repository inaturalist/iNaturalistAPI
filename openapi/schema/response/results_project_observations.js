const Joi = require( "@hapi/joi" );
const projectObservation = require( "./project_observation" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( projectObservation ).required( )
} ).unknown( false );
