const Joi = require( "@hapi/joi" );
const qualityMetric = require( "./quality_metric" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( qualityMetric ).required( )
} ).unknown( false );
