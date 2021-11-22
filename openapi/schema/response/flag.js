const Joi = require( "joi" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  comment: Joi.string( ).valid( null ),
  created_at: Joi.string( ),
  flag: Joi.string( ),
  resolved: Joi.boolean( ),
  resolver_id: Joi.number( ).integer( ),
  updated_at: Joi.string( ).valid( null ),
  user,
  user_id: Joi.number( ).integer( )
} ).unknown( false ).meta( { className: "Flag" } );
