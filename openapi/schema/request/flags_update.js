const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  flag: Joi.object( ).keys( {
    resolved: Joi.boolean( )
  } ),
  fields: Joi.any( )
} );
