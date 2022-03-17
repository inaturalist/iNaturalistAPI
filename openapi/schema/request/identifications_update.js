const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  identification: Joi.object( ).keys( {
    body: Joi.string( ),
    current: Joi
      .boolean( )
      .description( "Setting to false means the identification is withdrawn" )
  } ).required( )
} );
