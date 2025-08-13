const Joi = require( "joi" );
const observationSound = require( "./observation_sound" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( observationSound ).required( )
} ).unknown( false );
