const Joi = require( "@hapi/joi" );
const observationFieldValue = require( "./observation_field_value" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( observationFieldValue ).required( )
} ).unknown( false );
