const Joi = require( "@hapi/joi" );
const dateDetails = require( "./date_details" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  created_at: Joi.string( ),
  created_at_details: dateDetails,
  user,
  action: Joi.string( ),
  reason: Joi.string( )
} ).meta( { className: "ModeratorAction" } );
