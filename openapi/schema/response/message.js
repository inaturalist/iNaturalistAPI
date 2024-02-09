const Joi = require( "joi" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  user_id: Joi.number( ).integer( ),
  thread_id: Joi.number( ).integer( ),
  subject: Joi.string( ),
  body: Joi.string( ),
  read_at: Joi.date( ),
  created_at: Joi.date( ),
  updated_at: Joi.date( ),
  comments_count: Joi.number( ).integer( ),
  from_user: user.valid( null ),
  to_user: user.valid( null )
} ).unknown( false ).meta( { className: "Message" } );
