const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  created_after: Joi.string( )
    .description( "ISO8601 datetime after which the update was created" ),
  viewed: Joi.boolean( )
    .description(
      "When false this only returns updates that have not been viewed "
      + "by the authenticated user. When true it returns all updates."
    )
    .default( true ),
  observations_by: Joi.string( )
    .valid( "owner", "following" )
    .description(
      "Restrict to updates on observations by the authenticated user (owner) "
      + "or on observations the authenticated user is following"
    ),
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.any( )
} ).unknown( false );
