const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  saved_location: Joi.object( ).keys( {
    latitude: Joi.number( ),
    longitude: Joi.number( ),
    title: Joi.string( ),
    positional_accuracy: Joi.number( ).integer( ),
    geoprivacy: Joi.string( ).valid( "open", "obscured", "private" )
  } ).required( )
} );
