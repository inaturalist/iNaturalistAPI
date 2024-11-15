const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  skip_counts: Joi.boolean( ).default( false ).description(
    "If counts are not needed, consider setting this to true to save on "
    + "processing time, resulting in faster responses"
  ),
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.any( ),
  order_by: Joi.string( ).valid(
    "observations_count",
    "login"
  ).default( "observations_count" )
} ).unknown( false );
