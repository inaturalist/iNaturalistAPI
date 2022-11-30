const Joi = require( "joi" );
const project = require( "./project" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( Joi.object( {
    observation_count: Joi.number( ).integer( ).required( ),
    species_count: Joi.number( ).integer( ).required( ),
    observers_count: Joi.number( ).integer( ).required( ),
    project: project.required( )
  } ) ).required( )
} ).unknown( false );
