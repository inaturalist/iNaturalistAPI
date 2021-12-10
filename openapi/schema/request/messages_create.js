const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  message: Joi.object( ).keys( {
    to_user_id: Joi.number( ).integer( ),
    thread_id: Joi.number( ).integer( ),
    subject: Joi.string( ),
    body: Joi.string( ).required( )
  } ),
  fields: Joi.any( )
} );
