const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  created_at: Joi.date( ),
  id: Joi.number( ).integer( ).required( ),
  provider_name: Joi.string( ),
  provider_uid: Joi.string( ),
  scope: Joi.string( ).valid( null ),
  updated_at: Joi.date( ),
  user_id: Joi.number( ).integer( )
} ).unknown( false )
  .meta( { className: "ProviderAuthorization" } );
