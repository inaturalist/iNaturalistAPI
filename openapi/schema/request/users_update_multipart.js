const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  "user[login]": Joi.string( ),
  "user[email]": Joi.string( ),
  "user[name]": Joi.string( ),
  "user[icon]": Joi.binary( ),
  icon_delete: Joi.boolean( ).valid( true )
} );
