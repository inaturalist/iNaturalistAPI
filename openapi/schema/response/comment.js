const Joi = require( "@hapi/joi" );
const dateDetails = require( "./date_details" );
const flag = require( "./flag" );
const moderatorAction = require( "./moderator_action" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  body: Joi.string( ),
  created_at: Joi.string( ),
  created_at_details: dateDetails,
  flags: Joi.array( ).items( flag ),
  hidden: Joi.boolean( ),
  moderator_actions: Joi.array( ).items( moderatorAction ),
  user,
  uuid: Joi.string( ).guid( { version: "uuidv4" } )
} ).unknown( false ).meta( { className: "Comment" } );
