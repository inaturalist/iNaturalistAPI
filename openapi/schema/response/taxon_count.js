const Joi = require( "joi" );
const taxon = require( "./taxon" );

module.exports = Joi.object( ).keys( {
  taxon: taxon.required( ),
  count: Joi.number( ).integer( ).required( )
} ).unknown( false ).meta( { className: "TaxonCount" } );
