const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  user: Joi.object( ).keys( {
    login: Joi.string( ),
    email: Joi.string( ),
    name: Joi.string( )
  } ),
  icon_delete: Joi.boolean( )
} );
