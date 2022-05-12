const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  application: Joi.object( ).keys( {
    id: Joi.number( ).integer( ).required( ),
    name: Joi.string( ),
    official: Joi.boolean( )
  } ).required( ),
  created_at: Joi.date( ),
  scopes: Joi.array( ).items( Joi.string( ) )
} ).unknown( false )
  .meta( { className: "AuthorizedApplication" } );
