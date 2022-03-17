const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  comment: Joi.object( ).keys( {
    body: Joi.string( ).required( )
  } ).required( )
} );
