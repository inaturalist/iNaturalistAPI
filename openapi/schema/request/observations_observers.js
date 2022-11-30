const Joi = require( "joi" );
const observationsSearchSchema = require( "./observations_search" );

module.exports = observationsSearchSchema.keys( {
  order_by: Joi.string( ).valid(
    "observation_count",
    "species_count"
  ).default( "observation_count" )
} );
