const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  taxon_name_preference: Joi.object( ).required( ).keys( {
    position: Joi.number( ).integer( ).required( )
  } ).required( )
} );
