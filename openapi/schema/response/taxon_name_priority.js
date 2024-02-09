const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( ).required( ),
  user_id: Joi.number( ).integer( ).required( ),
  place_id: Joi.number( ).integer( ).valid( null ),
  place: {
    id: Joi.number( ).integer( ).required( ),
    uuid: Joi.string( ).guid( { version: "uuidv4" } ),
    display_name: Joi.string( ).valid( null ),
    name: Joi.string( )
  },
  lexicon: Joi.string( ).required( ).valid( null ),
  position: Joi.number( ).integer( ).required( ).valid( null )
} ).unknown( false ).meta( { className: "TaxonNamePriority" } );
