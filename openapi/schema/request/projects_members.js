const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.any( ),
  order_by: Joi.array( ).items( Joi.string( ).valid(
    "observations_count",
    "login"
  ) ).default( [ "observations_count" ] )
} ).unknown( false );
