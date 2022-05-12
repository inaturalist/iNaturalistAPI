const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ).default( "locale,language_in_locale" )
} ).unknown( true );
