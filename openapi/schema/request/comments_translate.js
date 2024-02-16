const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  comment: Joi.object( ).keys( {
    body: Joi.string( ).required( ),
    target: Joi.string( ).required( )
  } ).required( )
} );
