const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  user: Joi.object( ).keys( {
    email: Joi.string( ).email( ).required( )
  } )
} );
