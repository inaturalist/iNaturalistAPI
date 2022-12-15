const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( ).required( ),
  user_id: Joi.number( ).integer( ).required( ),
  place_id: Joi.number( ).integer( ).valid( null ),
  lexicon: Joi.string( ).required( ).valid( null ),
  position: Joi.number( ).integer( ).required( ).valid( null )
} ).unknown( false ).meta( { className: "TaxonNamePreference" } );
