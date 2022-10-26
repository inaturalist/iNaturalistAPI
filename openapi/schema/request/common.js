const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  "X-HTTP-Method-Override": Joi.string( ).meta( { in: "header" } )
} ).meta( { parameters: true } );
