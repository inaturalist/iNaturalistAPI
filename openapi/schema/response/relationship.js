const Joi = require( "joi" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  created_at: Joi.date( ),
  updated_at: Joi.date( ),
  user: user.description( "User that is the subject of the relationship" ),
  friend_user: user.description( "User that is the object of the relationship" ),
  following: Joi.boolean( ).description( "Whether the user notifications about new content made by the friend" ),
  trust: Joi.boolean( ).description( "Whether the user trusts the friend with hidden coordinates" ),
  reciprocal_trust: Joi.boolean( ).description( "Whether the friend trusts the user with hidden coordinates" )
} );
