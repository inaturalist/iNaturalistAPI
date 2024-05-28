const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  file: Joi.binary( ).required( ),
  fields: Joi.any( ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } )
} ).unknown( true );
