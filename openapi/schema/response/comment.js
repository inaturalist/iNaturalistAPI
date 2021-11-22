const Joi = require( "joi" );
const dateDetails = require( "./date_details" );
const flag = require( "./flag" );
const moderatorAction = require( "./moderator_action" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." ),
  body: Joi.string( ),
  created_at: Joi.date( ),
  created_at_details: dateDetails,
  created_at_utc: Joi.date( ),
  flags: Joi.array( ).items( flag ),
  hidden: Joi.boolean( ),
  html: Joi.string( ),
  moderator_actions: Joi.array( ).items( moderatorAction ),
  parent_id: Joi.number( ).integer( ).valid( null ),
  parent_type: Joi.string( ).valid( null ),
  user,
  user_id: Joi.number( ).integer( ).valid( null ),
  updated_at: Joi.date( ),
  updated_at_details: Joi.date( ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } ).required()
} ).unknown( false ).meta( { className: "Comment" } );
