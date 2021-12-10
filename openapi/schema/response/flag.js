const Joi = require( "joi" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  comment: Joi.string( ).valid( null ),
  created_at: Joi.date( ),
  created_at_utc: Joi.date( ).valid( null ),
  flag: Joi.string( ),
  flaggable_content: Joi.string( ).valid( null ),
  flaggable_id: Joi.number( ).integer( ).valid( null ),
  flaggable_type: Joi.string( ).valid( null ),
  flaggable_user_id: Joi.number( ).integer( ).valid( null ),
  resolved: Joi.boolean( ),
  resolver_id: Joi.number( ).integer( ).valid( null ),
  resolved_at: Joi.date( ).valid( null ),
  updated_at: Joi.date( ).valid( null ),
  updated_at_utc: Joi.date( ).valid( null ),
  user,
  user_id: Joi.number( ).integer( ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } ).valid( null )
} ).unknown( false ).meta( { className: "Flag" } );
