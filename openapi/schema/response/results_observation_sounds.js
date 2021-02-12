const Joi = require( "@hapi/joi" );
const observationPhoto = require( "./observation_photo" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( observationPhoto ).required( )
} ).unknown( false );
