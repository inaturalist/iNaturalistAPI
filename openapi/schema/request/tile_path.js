const Joi = require( "joi" );

module.exports = Joi.object( {
  zoom: Joi.number( ).integer( )
    .min( 0 )
    .max( 21 )
    .label( "zoom" )
    .meta( { in: "path" } )
    .required( ),
  x: Joi.number( ).integer( )
    .min( 0 )
    .label( "x" )
    .meta( { in: "path" } )
    .required( ),
  y: Joi.number( ).integer( )
    .min( 0 )
    .label( "y" )
    .meta( { in: "path" } )
    .required( )
} ).meta( { parameters: true } );
