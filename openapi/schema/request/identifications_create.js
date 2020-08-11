const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  identification: Joi.object( )
} );
