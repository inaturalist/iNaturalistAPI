const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  taxon_name_preference: Joi.object( ).required( ).keys( {
    // place_id: Joi.string( ).guid( { version: "uuidv4" } ),
    place_id: Joi.number( ).integer( ).valid( null ),
    lexicon: Joi.string( ).required( )
  } )
} );
