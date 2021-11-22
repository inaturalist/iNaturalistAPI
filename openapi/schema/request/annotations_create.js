const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  resource_type: Joi.string( ),
  resource_id: Joi.number( ).integer( ),
  controlled_attribute_id: Joi.number( ).integer( ),
  controlled_value_id: Joi.number( ).integer( )
} );
