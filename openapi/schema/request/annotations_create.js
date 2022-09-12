const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  resource_type: Joi.string( ).required( ),
  resource_id: Joi.string( ).guid( { version: "uuidv4" } ).required( ),
  controlled_attribute_id: Joi.number( ).integer( ).required( ),
  controlled_value_id: Joi.number( ).integer( ).required( )
} );
