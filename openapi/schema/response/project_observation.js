const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  uuid: Joi.string( ).guid( { version: "uuidv4" } ).required( )
} );
