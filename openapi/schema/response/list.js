const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  title: Joi.string( )
} ).unknown( false ).meta( { className: "List" } )
  .valid( null );
