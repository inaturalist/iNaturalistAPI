const Joi = require( "joi" );
const observationsSearchSchema = require( "./observations_search" );

module.exports = observationsSearchSchema.keys( {
  date_field: Joi.string( ).valid(
    "observed",
    "created"
  ).default( "observed" ),
  interval: Joi.string( ).valid(
    "year",
    "month",
    "week",
    "day",
    "hour",
    "month_of_year",
    "week_of_year"
  ).default( "month_of_year" )
} );
