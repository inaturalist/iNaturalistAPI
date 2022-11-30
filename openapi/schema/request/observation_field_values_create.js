const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  observation_field_value: Joi.object( ).keys( {
    observation_id: Joi.string( ).guid( { version: "uuidv4" } ).required( ),
    observation_field_id: Joi.number( ).integer( ),
    value: Joi.string( )
  } )
} );
