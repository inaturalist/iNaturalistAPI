const Joi = require( "joi" );
const observationField = require( "./observation_field" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( observationField ).required( )
} ).unknown( false );
