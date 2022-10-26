const Joi = require( "joi" );
const openapiUtil = require( "../../openapi_util" );

module.exports = openapiUtil.referenceGetParameters( "observations_search" ).keys( {
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
} ).meta( { parameters: true } );
