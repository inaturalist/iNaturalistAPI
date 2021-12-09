const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  id: Joi.array( ).items( Joi.number( ).integer( ) ),
  not_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  lat: Joi.number( ).min( -90 ).max( 90 ),
  lng: Joi.number( ).min( -180 ).max( 180 ),
  radius: Joi.number( ).integer( ),
  place_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  features: Joi.boolean( ).valid( true ),
  noteworthy: Joi.boolean( ).valid( true ),
  site_id: Joi.number( ).integer( ),
  rule_details: Joi.boolean( ).valid( true ),
  type: Joi.array( ).items( Joi.string( ).valid(
    "collection",
    "umbrella"
  ) ),
  member_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  has_params: Joi.boolean( ),
  has_posts: Joi.boolean( ),
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( ),
  order_by: Joi.string( ).valid(
    "recent_posts",
    "created",
    "updated",
    "distance",
    "featured"
  )
} );
