const Joi = require( "joi" );
const openapiUtil = require( "../../openapi_util" );

module.exports = openapiUtil.referenceGetParameters( "observations_search" ).keys( {
  no_histograms: Joi.boolean( ),
  unannotated: Joi.boolean( ),
  date_field: Joi.string( ).valid(
    "observed",
    "created"
  ).default( "observed" ),
  interval: Joi.string( ).valid(
    "month_of_year",
    "week_of_year"
  ).default( "month_of_year" )
} ).meta( { parameters: true } );
