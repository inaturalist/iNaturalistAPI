const Joi = require( "joi" );
const photo = require( "./photo" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( ).description( "Unique auto-increment integer identifier." ).required( ),
  photo,
  position: Joi.number( ).integer( ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } )
} ).unknown( false );
