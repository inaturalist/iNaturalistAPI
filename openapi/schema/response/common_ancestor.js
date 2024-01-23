const Joi = require( "joi" );
const taxon = require( "./taxon" );

module.exports = Joi.object( ).keys( {
  score: Joi.number( ),
  taxon: taxon.required( )
} ).description( `
  Common ancestor taxon of some of the top results weighted by combined score.
  If present, it generally has a much higher chance of being accurate (if not
  precise), often by as much as 30-40 percentage points.
`.replace( /\s+/m, " " ) ).meta( { className: "CommonAncestor" } );
