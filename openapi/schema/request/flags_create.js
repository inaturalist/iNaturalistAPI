const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  flag: Joi.object( ).keys( {
    flaggable_type: Joi.string( ),
    flaggable_id: Joi.number( ).integer( ),
    flag: Joi.string( )
  } ),
  flag_explanation: Joi.string( ),
  fields: Joi.any( )
} );
