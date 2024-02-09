const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( ).required( ),
  body: Joi.string( ),
  placement: Joi.string( ),
  clients: Joi.array( ).items( Joi.string( ) ),
  dismissible: Joi.boolean( ),
  locales: Joi.array( ).items( Joi.string( ) ),
  start: Joi.date( ),
  end: Joi.date( )
} ).unknown( false ).meta( { className: "Announcement" } );
