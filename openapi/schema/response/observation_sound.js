const Joi = require( "@hapi/joi" );
const sound = require( "./sound" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( ).description( "Unique auto-increment integer identifier." ),
  sound,
  position: Joi.number( ).integer( ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } )
} ).unknown( false );
