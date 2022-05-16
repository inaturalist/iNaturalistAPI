const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  created_at: Joi.date( ),
  id: Joi.number( ).integer( ).required( ),
  provider_name: Joi
    .string( )
    .valid(
      "apple",
      "facebook",
      "flickr",
      "google_oauth2",
      "open_id",
      "orcid",
      "soundcloud",
      "twitter"
    )
    .description(
      "Name of the provider from a controlled vocabulary. The `open_id` means Yahoo in this context"
    )
    .example( "google_oauth2" ),
  provider_uid: Joi.string( ).description( "Unique identifier for the user from the provider" ),
  scope: Joi
    .string( )
    .valid( null )
    .example( "email,user_photos" )
    .description( "Comma-separated list of OAuth scopes granted by the provider" ),
  updated_at: Joi.date( ),
  user_id: Joi.number( ).integer( )
} ).unknown( false )
  .meta( { className: "ProviderAuthorization" } );
