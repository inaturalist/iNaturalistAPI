const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  page: Joi.number( ).integer( ).min( 1 ),
  per_page: Joi.number( ).integer( ).min( 1 ).max( 200 ),
  following: Joi
    .alternatives( ).try(
      Joi.number( ).integer( ).min( 1 ),
      Joi.string( ),
      Joi.string( ).guid( )
    )
    .example( "1234" )
    .description( "Show users following this user, specified by sequential ID, username, or UUID" ),
  followed_by: Joi
    .alternatives( ).try(
      Joi.number( ).integer( ).min( 1 ),
      Joi.string( ),
      Joi.string( ).guid( )
    )
    .example( "1234" )
    .description( "Show users followed by this user, specified by sequential ID, username, or UUID" )
} );
