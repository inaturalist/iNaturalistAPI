const Joi = require( "joi" );
const comment = require( "./comment" );
const identification = require( "./identification" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  comment,
  comment_id: Joi.number( ).integer( ).valid( null ),
  created_at: Joi.date( ),
  identification,
  identification_id: Joi.number( ).integer( ).valid( null ),
  notifier_id: Joi.number( ).integer( ),
  notifier_type: Joi.string( ),
  notification: Joi.string( ),
  resource_owner_id: Joi.number( ).integer( ),
  resource_type: Joi.string( ),
  resource_id: Joi.number( ).integer( ),
  resource_uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  viewed: Joi.boolean( )
} ).unknown( false );
