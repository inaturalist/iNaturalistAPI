const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  description: Joi.string( )
    .description( "The description." )
} );
