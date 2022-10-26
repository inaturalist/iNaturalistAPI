const Joi = require( "joi" );
const openapiUtil = require( "../../openapi_util" );

module.exports = openapiUtil.referenceGetParameters( "observations_search" ).keys( {
  order_by: Joi.string( ).valid(
    "observation_count",
    "species_count"
  ).default( "observation_count" )
} ).meta( { parameters: true } );
