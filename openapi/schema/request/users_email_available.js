const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  // Omitting the joi.email() type b/c we don't want any email format
  // validation on this endpoint
  email: Joi.string( ).required( )
} );
