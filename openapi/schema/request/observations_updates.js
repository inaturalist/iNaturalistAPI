const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  created_after: Joi.string( ),
  viewed: Joi.boolean( ),
  observations_by: Joi.string( ).valid(
    "owner",
    "following"
  ),
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.any( )
} ).unknown( false );
