const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  valid: Joi.boolean( )
} );
