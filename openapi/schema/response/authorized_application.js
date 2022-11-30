const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  application: Joi.object( ).keys( {
    id: Joi.number( ).integer( ).required( ),
    name: Joi.string( ).example( "iNaturalist iPhone App" ),
    official: Joi.boolean( ).description( "Whether this application is controlled by iNaturalist itself" )
  } ).required( ),
  created_at: Joi.date( ),
  scopes: Joi.array( ).items(
    Joi.string( ).valid( "login", "write", "account_delete" ).example( ["login", "write"] )
  ).description(
    "List of scopes granted to this application. `login` "
    + "provides access to information required for logging into a third-party "
    + "service like user ID, email address, profile pic, etc. `write` allows the "
    + "application to post content to iNat as the user; `account_delete` allows "
    + "the application to delete the user's iNat account."
  )
} ).unknown( false )
  .meta( { className: "AuthorizedApplication" } );
